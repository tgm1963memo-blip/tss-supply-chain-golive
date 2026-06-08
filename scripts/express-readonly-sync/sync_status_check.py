#!/usr/bin/env python3
"""Check Express → Supabase read-only sync status and UAT data counts."""
import json
import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client
except ImportError:
    print(json.dumps({"error": "Install: pip install supabase python-dotenv"}, indent=2))
    sys.exit(1)

import express_table_mapping as config

ROOM = os.getenv("SYNC_ROOM_CODE", config.SYNC_ROOM_CODE)
URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

COUNTS = [
    ("products", "sc_express_products"),
    ("customers", "sc_express_customers"),
    ("stock_rows", "sc_express_stock"),
    ("so_headers", "sc_express_so_headers"),
    ("so_lines", "sc_express_so_lines"),
    ("invoices", "sc_express_invoices"),
]


def head_count(client, table):
    try:
        result = client.from_(table).select("*", count="exact", head=True).eq("room_code", ROOM)
        return result.count if result.count is not None else 0, None
    except Exception as exc:
        return None, str(exc)


def latest_sync(client):
    try:
        result = (
            client.from_("sync_jobs")
            .select("source_table,status,started_at,finished_at,last_error")
            .eq("room_code", ROOM)
            .order("created_at", ascending=False)
            .limit(10)
            .execute()
        )
        return result.data or [], None
    except Exception as exc:
        return [], str(exc)


def failed_count(client):
    try:
        result = (
            client.from_("sync_failed_records")
            .select("*", count="exact", head=True)
            .eq("room_code", ROOM)
            .execute()
        )
        return result.count or 0, None
    except Exception as exc:
        return None, str(exc)


def latest_invoice_date(client):
    try:
        result = (
            client.from_("sc_express_invoices")
            .select("invoice_date")
            .eq("room_code", ROOM)
            .order("invoice_date", ascending=False)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        return rows[0].get("invoice_date") if rows else None, None
    except Exception as exc:
        return None, str(exc)


def sample_documents(client):
    samples = {}
    try:
        so = (
            client.from_("sc_express_so_headers")
            .select("document_no")
            .eq("room_code", ROOM)
            .limit(3)
            .execute()
        )
        samples["so_documents"] = [r.get("document_no") for r in (so.data or [])]
    except Exception:
        samples["so_documents"] = []
    return samples


def main():
    if not URL or not KEY:
        print(json.dumps({
            "configured": False,
            "message": "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* for read-only check)",
        }, indent=2))
        return 1

    client = create_client(URL, KEY)
    status = {
        "checked_at": datetime.utcnow().isoformat() + "Z",
        "room_code": ROOM,
        "express_dbf_path": os.getenv("EXPRESS_DBF_PATH", ""),
        "configured": True,
        "read_only_mode": True,
        "express_write_back": False,
        "counts": {},
        "errors": {},
        "last_sync_jobs": [],
        "failed_records": None,
        "latest_invoice_date": None,
        "samples": {},
    }

    for label, table in COUNTS:
        count, err = head_count(client, table)
        status["counts"][label] = count
        if err:
            status["errors"][label] = err

    jobs, job_err = latest_sync(client)
    status["last_sync_jobs"] = jobs
    if job_err:
        status["errors"]["sync_jobs"] = job_err

    failed, fail_err = failed_count(client)
    status["failed_records"] = failed
    if fail_err:
        status["errors"]["sync_failed_records"] = fail_err

    inv_date, inv_err = latest_invoice_date(client)
    status["latest_invoice_date"] = inv_date
    if inv_err:
        status["errors"]["latest_invoice_date"] = inv_err

    status["samples"] = sample_documents(client)

    if jobs:
        status["last_sync_time"] = jobs[0].get("finished_at") or jobs[0].get("started_at")
    else:
        status["last_sync_time"] = None
        status["message"] = "Express sync status will appear after first readonly sync."

    print(json.dumps(status, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
