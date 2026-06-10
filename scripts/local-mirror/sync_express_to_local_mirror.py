#!/usr/bin/env python3
"""Sync Express DBF files into local mirror tables (read-only — no Express write-back)."""
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

from dotenv import load_dotenv

from local_mirror_config import (
    DBF_LOCAL_TABLES,
    ENV_FILE_ORDER,
    LOCAL_MIRROR_BATCH_SIZE,
    READONLY_MODE,
)
from local_mirror_db import LocalMirrorDB, deterministic_source_id, utc_now_iso

import express_table_mapping as express_config
from dbf_run_cache import cleanup_run_cache, make_run_cache_root
from express_sync_engine import ExpressSync
from safe_dbf_parser import get_first, safe_print, to_number


def load_environment() -> None:
    for path in ENV_FILE_ORDER:
        if path.exists():
            load_dotenv(path, override=True)
    if hasattr(express_config, "reload_from_env"):
        express_config.reload_from_env()


def assert_readonly_mode() -> None:
    if not READONLY_MODE:
        raise RuntimeError("Local mirror requires READONLY_MODE=true.")
    readonly_env = __import__("os").getenv("READONLY_MODE", "true").lower()
    if readonly_env not in ("1", "true", "yes"):
        raise RuntimeError("READONLY_MODE env must be true for local mirror sync.")


def map_to_local_row(room_code: str, table_name: str, raw_record: dict) -> tuple[str, dict]:
    table_name = table_name.upper()
    local_table = DBF_LOCAL_TABLES[table_name]
    synced_at = utc_now_iso()

    if table_name == "STMAS.DBF":
        product_code = get_first(raw_record, "STKCOD", "STK_CODE", "CODE")
        source_row_id = deterministic_source_id(table_name, [room_code, product_code])
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "product_code": product_code,
            "product_name": get_first(raw_record, "STKDES", "STK_NAME", "NAME"),
            "product_group": get_first(raw_record, "STKGRP", "GROUP_CODE"),
            "unit_code": get_first(raw_record, "QUCOD", "UOM"),
        }

    if table_name == "ARMAS.DBF":
        customer_code = get_first(raw_record, "CUSCOD", "AR_CODE", "CODE")
        source_row_id = deterministic_source_id(table_name, [room_code, customer_code])
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "customer_code": customer_code,
            "customer_name": get_first(raw_record, "SNAM", "CUSNAM", "NAME"),
            "customer_group": get_first(raw_record, "CUSGRP", "GROUP_CODE"),
            "tax_id": get_first(raw_record, "TAXID", "TAX_ID"),
            "sales_code": get_first(raw_record, "SLMCOD", "SALE_CODE"),
        }

    if table_name == "STLOC.DBF":
        product_code = get_first(raw_record, "STKCOD", "STK_CODE")
        warehouse_code = get_first(raw_record, "LOCCOD", "WAREHOUSE", "WHCODE")
        location_code = get_first(raw_record, "LOCCOD", "LOCATION")
        lot_no = get_first(raw_record, "LOTNO", "LOT", default="")
        source_row_id = deterministic_source_id(
            table_name, [room_code, product_code, warehouse_code, location_code, lot_no]
        )
        qty = to_number(
            get_first(raw_record, "LOCBAL", "MREMBAL", "BALANCE", "QTY", "QTY_ON_HAND")
        )
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "product_code": product_code,
            "warehouse_code": warehouse_code,
            "location_code": location_code,
            "lot_no": lot_no,
            "qty_on_hand": qty,
        }

    if table_name == "OESO.DBF":
        document_no = get_first(raw_record, "SONUM", "DOCNO", "DOC_NO")
        source_row_id = deterministic_source_id(table_name, [room_code, document_no])
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "document_no": document_no,
            "customer_code": get_first(raw_record, "CUSCOD", "CUSTOMER_CODE"),
            "document_date": get_first(raw_record, "SODAT", "DOCDAT", "DOC_DATE"),
            "delivery_date": get_first(raw_record, "DLVDAT", "DELIVERY_DATE"),
            "status": get_first(raw_record, "STATUS", "DOCSTAT", default="open"),
            "total_amount": to_number(get_first(raw_record, "NETAMT", "TOTAL", "AMOUNT")),
        }

    if table_name == "OESOIT.DBF":
        document_no = get_first(raw_record, "SONUM", "DOCNO", "DOC_NO")
        line_no = int(to_number(get_first(raw_record, "SEQNUM", "LINE_NO"), default=0))
        source_row_id = deterministic_source_id(table_name, [room_code, document_no, line_no])
        order_qty = to_number(get_first(raw_record, "ORDQTY", "QTY"))
        shipped_qty = to_number(get_first(raw_record, "SHIPQTY", "SHIPPED_QTY"))
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "document_no": document_no,
            "line_no": line_no,
            "product_code": get_first(raw_record, "STKCOD", "PRODUCT_CODE"),
            "order_qty": order_qty,
            "shipped_qty": shipped_qty,
            "status": get_first(raw_record, "STATUS", default="open"),
        }

    if table_name == "ARTRN.DBF":
        document_no = get_first(raw_record, "DOCNUM", "DOCNO", "INVNO")
        line_no = int(to_number(get_first(raw_record, "SEQNUM", "SEQ", "LINE_NO", "TRNLIN"), default=0))
        source_row_id = deterministic_source_id(table_name, [room_code, document_no, line_no])
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "document_no": document_no,
            "line_no": line_no,
            "customer_code": get_first(raw_record, "CUSCOD", "CUSTOMER_CODE"),
            "product_code": get_first(raw_record, "STKCOD", "PRODUCT_CODE", "ITEMCOD"),
            "invoice_date": get_first(raw_record, "DOCDAT", "INVDAT", "DOC_DATE"),
            "sales_qty": to_number(get_first(raw_record, "QTY", "ORDQTY")),
            "sales_amount": to_number(get_first(raw_record, "NETAMT", "AMOUNT", "TOTAL")),
            "status": get_first(raw_record, "STATUS", default="synced"),
        }

    if table_name == "STTRN.DBF":
        document_no = get_first(raw_record, "DOCNUM", "DOCNO")
        source_row_id = deterministic_source_id(table_name, [room_code, document_no])
        return local_table, {
            "room_code": room_code,
            "source_table": table_name,
            "source_row_id": source_row_id,
            "raw_data": raw_record,
            "synced_at": synced_at,
            "document_no": document_no,
            "from_warehouse_code": get_first(raw_record, "FRLOCCOD", "FROM_LOC", "FROM_WAREHOUSE"),
            "to_warehouse_code": get_first(raw_record, "TOLOCCOD", "TO_LOC", "TO_WAREHOUSE"),
            "transfer_date": get_first(raw_record, "DOCDAT", "TRANSFER_DATE"),
            "status": get_first(raw_record, "STATUS", default="synced"),
        }

    raise ValueError(f"Unsupported table: {table_name}")


def sync_table_to_local(
    engine: ExpressSync,
    db: LocalMirrorDB,
    room_code: str,
    table_name: str,
    *,
    limit: int | None = None,
    dry_run: bool = False,
) -> dict:
    table_name = table_name.upper()
    local_table = DBF_LOCAL_TABLES[table_name]
    batch: list[dict] = []
    read_count = 0
    written = 0

    for raw_record in engine.read_dbf_records(room_code, table_name):
        read_count += 1
        if limit is not None and read_count > limit:
            break
        _, row = map_to_local_row(room_code, table_name, raw_record)
        batch.append(row)
        if len(batch) >= LOCAL_MIRROR_BATCH_SIZE:
            if not dry_run:
                written += db.upsert_mirror_rows(local_table, batch)
            else:
                written += len(batch)
            batch = []

    if batch:
        if not dry_run:
            written += db.upsert_mirror_rows(local_table, batch)
        else:
            written += len(batch)

    return {
        "room_code": room_code,
        "source_table": table_name,
        "local_table": local_table,
        "records_read": read_count,
        "records_written": written,
        "dry_run": dry_run,
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Sync Express DBF into local mirror (read-only).")
    parser.add_argument("--room", action="append", help="Room code (repeatable). Defaults to active rooms.")
    parser.add_argument("--table", help="Single DBF table e.g. STMAS.DBF")
    parser.add_argument("--limit", type=int, help="Max records per table (testing)")
    parser.add_argument("--dry-run", action="store_true", help="Read DBF but do not write local DB")
    return parser.parse_args()


def main() -> int:
    load_environment()
    assert_readonly_mode()
    args = parse_args()

    rooms = args.room or express_config.ACTIVE_ROOMS
    tables = [args.table.upper()] if args.table else list(DBF_LOCAL_TABLES.keys())

    safe_print("[LOCAL-MIRROR] read-only sync starting")
    safe_print(f"[LOCAL-MIRROR] engine will use: {LocalMirrorDB().engine}")

    engine = ExpressSync()
    results = []

    try:
        with LocalMirrorDB() as db:
            for room_code in rooms:
                normalized = express_config.normalize_room_code(room_code)
                for table_name in tables:
                    safe_print(f"[LOCAL-MIRROR] {normalized} / {table_name}")
                    result = sync_table_to_local(
                        engine,
                        db,
                        normalized,
                        table_name,
                        limit=args.limit,
                        dry_run=args.dry_run,
                    )
                    results.append(result)
                    safe_print(
                        f"  read={result['records_read']} written={result['records_written']}"
                    )
    finally:
        cleanup_run_cache(engine.run_cache_root, engine.copied_cache_files)

    summary_path = SCRIPT_DIR / "logs" / f"sync_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    safe_print(f"[LOCAL-MIRROR] summary: {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
