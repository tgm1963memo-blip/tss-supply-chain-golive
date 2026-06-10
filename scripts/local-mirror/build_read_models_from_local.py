#!/usr/bin/env python3
"""Build compact read models from local raw mirror tables."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
EXPRESS_SYNC_DIR = SCRIPT_DIR.parent / "express-readonly-sync"
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(EXPRESS_SYNC_DIR))

from local_mirror_config import OPEN_SO_STATUS_BLOCKLIST
from local_mirror_db import LocalMirrorDB, utc_now_iso

try:
    from safe_dbf_parser import safe_print
except ImportError:
    def safe_print(msg):
        print(msg, flush=True)


def _is_open_status(status: str | None) -> bool:
    if not status:
        return True
    return status.strip().lower() not in OPEN_SO_STATUS_BLOCKLIST


def build_product_master(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    rows = db.fetchall(
        """
        select room_code, product_code, product_name, product_group, unit_code, raw_data
        from local_express_products
        where product_code is not null and product_code <> ''
        """
    )
    result = []
    for row in rows:
        raw = row.get("raw_data")
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                raw = {}
        raw = raw or {}
        result.append({
            "room_code": row["room_code"],
            "product_code": row["product_code"],
            "product_name": row.get("product_name") or row["product_code"],
            "product_group": row.get("product_group") or "",
            "category": raw.get("category") or raw.get("stkcat") or "",
            "unit_code": row.get("unit_code") or raw.get("uom") or "KG",
            "barcode": raw.get("barcode") or raw.get("barcod") or raw.get("stkbar") or "",
            "active_status": raw.get("active_status") or raw.get("is_active") or "active",
            "synced_at": synced_at,
        })
    return result


def build_customer_master(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    rows = db.fetchall(
        """
        select room_code, customer_code, customer_name, customer_group, tax_id, raw_data
        from local_express_customers
        where customer_code is not null and customer_code <> ''
        """
    )
    result = []
    for row in rows:
        raw = row.get("raw_data")
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                raw = {}
        raw = raw or {}
        result.append({
            "room_code": row["room_code"],
            "customer_code": row["customer_code"],
            "customer_name": row.get("customer_name") or row["customer_code"],
            "tax_id": row.get("tax_id") or raw.get("taxid") or "",
            "customer_group": row.get("customer_group") or "",
            "channel": raw.get("channel") or raw.get("chnl") or "",
            "phone": raw.get("phone") or raw.get("tel") or "",
            "address": raw.get("address") or raw.get("addr") or "",
            "active_status": raw.get("active_status") or "active",
            "synced_at": synced_at,
        })
    return result


def build_stock_balance(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    rows = db.fetchall(
        """
        select s.room_code, s.product_code, s.warehouse_code, s.location_code, s.lot_no,
               s.qty_on_hand, p.product_name
        from local_express_stock s
        left join local_express_products p
          on p.room_code = s.room_code and p.product_code = s.product_code
        where s.product_code is not null and s.product_code <> ''
        """
    )
    result = []
    for row in rows:
        qty = float(row.get("qty_on_hand") or 0)
        result.append({
            "room_code": row["room_code"],
            "product_code": row["product_code"],
            "product_name": row.get("product_name") or row["product_code"],
            "warehouse_code": row.get("warehouse_code") or "",
            "location_code": row.get("location_code") or "",
            "lot_no": row.get("lot_no") or "",
            "qty_on_hand": qty,
            "qty_reserved": 0,
            "qty_available": qty,
            "synced_at": synced_at,
        })
    return result


def build_open_so_headers(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    headers = db.fetchall(
        """
        select h.room_code, h.document_no, h.document_date, h.customer_code,
               h.delivery_date, h.status, h.total_amount, c.customer_name
        from local_express_so_headers h
        left join local_express_customers c
          on c.room_code = h.room_code and c.customer_code = h.customer_code
        where h.document_no is not null and h.document_no <> ''
        """
    )
    return [
        {
            "room_code": row["room_code"],
            "document_no": row["document_no"],
            "document_date": row.get("document_date") or "",
            "customer_code": row.get("customer_code") or "",
            "customer_name": row.get("customer_name") or row.get("customer_code") or "",
            "status": row.get("status") or "open",
            "ship_date": row.get("delivery_date") or "",
            "total_amount": float(row.get("total_amount") or 0),
            "synced_at": synced_at,
        }
        for row in headers
        if _is_open_status(row.get("status"))
    ]


def build_open_so_lines(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    open_docs = {
        (row["room_code"], row["document_no"])
        for row in build_open_so_headers(db, synced_at)
    }
    lines = db.fetchall(
        """
        select l.room_code, l.document_no, l.line_no, l.product_code,
               l.order_qty, l.shipped_qty, l.status, h.delivery_date,
               p.product_name
        from local_express_so_lines l
        left join local_express_so_headers h
          on h.room_code = l.room_code and h.document_no = l.document_no
        left join local_express_products p
          on p.room_code = l.room_code and p.product_code = l.product_code
        where l.document_no is not null and l.document_no <> ''
        """
    )
    result = []
    for row in lines:
        key = (row["room_code"], row["document_no"])
        if key not in open_docs:
            continue
        order_qty = float(row.get("order_qty") or 0)
        shipped_qty = float(row.get("shipped_qty") or 0)
        remaining = max(order_qty - shipped_qty, 0)
        if remaining <= 0 and not _is_open_status(row.get("status")):
            continue
        result.append({
            "room_code": row["room_code"],
            "document_no": row["document_no"],
            "line_no": int(row.get("line_no") or 0),
            "product_code": row.get("product_code") or "",
            "product_name": row.get("product_name") or row.get("product_code") or "",
            "order_qty": order_qty,
            "shipped_qty": shipped_qty,
            "remaining_qty": remaining if remaining > 0 else order_qty,
            "warehouse_code": "",
            "ship_date": row.get("delivery_date") or "",
            "status": row.get("status") or "open",
            "synced_at": synced_at,
        })
    return result


def build_sales_daily_summary(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    rows = db.fetchall(
        """
        select i.room_code,
               substr(coalesce(i.invoice_date, ''), 1, 10) as sales_date,
               coalesce(i.customer_code, '') as customer_code,
               coalesce(c.customer_name, i.customer_code, '') as customer_name,
               coalesce(i.product_code, '') as product_code,
               coalesce(p.product_name, i.product_code, '') as product_name,
               coalesce(p.product_group, '') as product_group,
               sum(coalesce(i.sales_qty, 0)) as sales_qty,
               sum(coalesce(i.sales_amount, 0)) as sales_amount,
               count(distinct i.document_no) as invoice_count
        from local_express_invoices i
        left join local_express_customers c
          on c.room_code = i.room_code and c.customer_code = i.customer_code
        left join local_express_products p
          on p.room_code = i.room_code and p.product_code = i.product_code
        where i.invoice_date is not null and i.invoice_date <> ''
        group by 1, 2, 3, 4, 5, 6, 7
        """
    )
    return [
        {
            "room_code": row["room_code"],
            "sales_date": row["sales_date"],
            "customer_code": row["customer_code"],
            "customer_name": row["customer_name"],
            "product_code": row["product_code"],
            "product_name": row["product_name"],
            "product_group": row["product_group"],
            "sales_qty": float(row.get("sales_qty") or 0),
            "sales_amount": float(row.get("sales_amount") or 0),
            "invoice_count": int(row.get("invoice_count") or 0),
            "synced_at": synced_at,
        }
        for row in rows
        if row.get("sales_date")
    ]


def build_sales_monthly_summary(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    daily = build_sales_daily_summary(db, synced_at)
    grouped: dict[tuple, dict] = {}
    for row in daily:
        sales_month = str(row["sales_date"])[:7]
        key = (
            row["room_code"],
            sales_month,
            row["customer_code"],
            row["product_code"],
        )
        if key not in grouped:
            grouped[key] = {
                **row,
                "sales_month": sales_month,
                "sales_qty": 0.0,
                "sales_amount": 0.0,
                "invoice_count": 0,
            }
        grouped[key]["sales_qty"] += row["sales_qty"]
        grouped[key]["sales_amount"] += row["sales_amount"]
        grouped[key]["invoice_count"] += row["invoice_count"]
    return list(grouped.values())


def build_consi_branch_stock(db: LocalMirrorDB, synced_at: str) -> list[dict]:
    """Best-effort consignment branch stock from CONSI room stock rows."""
    rows = db.fetchall(
        """
        select s.room_code, s.product_code, s.warehouse_code, s.location_code,
               s.qty_on_hand, p.product_name, c.customer_code, c.customer_name
        from local_express_stock s
        left join local_express_products p
          on p.room_code = s.room_code and p.product_code = s.product_code
        left join local_express_customers c
          on c.room_code = s.room_code
         and c.customer_code = coalesce(s.warehouse_code, s.location_code, '')
        where upper(s.room_code) = 'CONSI'
        """
    )
    result = []
    for row in rows:
        branch_code = row.get("location_code") or row.get("warehouse_code") or ""
        result.append({
            "room_code": row["room_code"],
            "customer_code": row.get("customer_code") or branch_code,
            "customer_name": row.get("customer_name") or "",
            "branch_code": branch_code,
            "branch_name": branch_code,
            "product_code": row.get("product_code") or "",
            "product_name": row.get("product_name") or row.get("product_code") or "",
            "qty_on_branch": float(row.get("qty_on_hand") or 0),
            "qty_sold": 0,
            "qty_returned": 0,
            "synced_at": synced_at,
        })
    return result


BUILDERS = {
    "rm_product_master": build_product_master,
    "rm_customer_master": build_customer_master,
    "rm_stock_balance": build_stock_balance,
    "rm_open_so_headers": build_open_so_headers,
    "rm_open_so_lines": build_open_so_lines,
    "rm_sales_daily_summary": build_sales_daily_summary,
    "rm_sales_monthly_summary": build_sales_monthly_summary,
    "rm_consi_branch_stock": build_consi_branch_stock,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Build compact read models in local mirror DB.")
    parser.add_argument("--model", help="Single read model table e.g. rm_product_master")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    synced_at = utc_now_iso()
    targets = [args.model] if args.model else list(BUILDERS.keys())
    summary = {}

    with LocalMirrorDB() as db:
        for table_name in targets:
            if table_name not in BUILDERS:
                raise SystemExit(f"Unknown read model: {table_name}")
            rows = BUILDERS[table_name](db, synced_at)
            count = db.replace_read_model(table_name, rows)
            summary[table_name] = count
            safe_print(f"[BUILD-RM] {table_name}: {count} rows")

    log_path = SCRIPT_DIR / "logs" / f"build_rm_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    safe_print(f"[BUILD-RM] summary: {log_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
