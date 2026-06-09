#!/usr/bin/env python3
"""Check Express → Supabase read-only sync status, agent runs, and UAT data counts."""
import json
import os
import sys
from datetime import datetime

from env_loader import ensure_sync_environment, print_startup_diagnostics

ensure_sync_environment()

try:
    from supabase import create_client
except ImportError:
    print(json.dumps({"error": "Install: pip install supabase python-dotenv"}, indent=2))
    sys.exit(1)

import express_table_mapping as config
import sync_state

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

AGENT_RUNS = [
    "active_rolling",
    "master_daily",
    "read_model_refresh",
    "historical_once",
]

SYNC_FAILED_RECORDS_MISSING = "sync_failed_records table not found or not accessible"


def apply_order_desc(query, column):
    """Compatible order desc across supabase-py versions."""
    try:
        return query.order(column, desc=True)
    except TypeError:
        try:
            return query.order(column, ascending=False)
        except TypeError:
            return query.order(column)


def head_count(client, table, room_code):
    try:
        result = (
            client.from_(table)
            .select("*", count="exact")
            .eq("room_code", room_code)
            .limit(1)
            .execute()
        )
        return result.count if result.count is not None else 0, None
    except Exception as exc:
        return None, str(exc)


def latest_sync_by_table(client, room_code):
    try:
        query = (
            client.from_("sync_jobs")
            .select("source_table,status,started_at,finished_at,last_error,job_name,created_at")
            .eq("room_code", room_code)
            .like("job_name", "express_sync:%")
        )
        result = apply_order_desc(query, "created_at").limit(50).execute()
        by_table = {}
        for row in result.data or []:
            table = row.get("source_table")
            if table and table not in by_table:
                by_table[table] = row
        return by_table, None
    except Exception as exc:
        return {}, str(exc)


def latest_agent_jobs(client):
    try:
        query = (
            client.from_("sync_jobs")
            .select("job_name,source_table,status,started_at,finished_at,last_error,created_at")
            .eq("room_code", "SYSTEM")
            .like("job_name", "agent:%")
        )
        result = apply_order_desc(query, "created_at").limit(20).execute()
        by_run = {}
        for row in result.data or []:
            key = row.get("source_table") or row.get("job_name", "").replace("agent:", "")
            if key and key not in by_run:
                by_run[key] = row
        return by_run, None
    except Exception as exc:
        return {}, str(exc)


def failed_count(client, room_code):
    try:
        result = (
            client.from_("sync_failed_records")
            .select("*", count="exact")
            .eq("room_code", room_code)
            .limit(1)
            .execute()
        )
        return result.count or 0, None
    except Exception as exc:
        message = str(exc).lower()
        if any(token in message for token in ("does not exist", "not found", "404", "42p01", "pgrst")):
            return None, SYNC_FAILED_RECORDS_MISSING
        return None, str(exc)


def main():
    print_startup_diagnostics()

    if not URL or not KEY:
        print(json.dumps({
            "configured": False,
            "message": "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* for read-only check)",
        }, indent=2))
        return 1

    client = create_client(URL, KEY)
    local_state = sync_state.load_state()
    agent_local = local_state.get("agent_runs", {})

    status = {
        "checked_at": datetime.utcnow().isoformat() + "Z",
        "room_code": ROOM,
        "active_rooms": config.ACTIVE_ROOMS,
        "historical_rooms": config.HISTORICAL_ROOMS,
        "express_dbf_path": os.getenv("EXPRESS_DBF_PATH", str(config.ERP_BASE_PATH)),
        "configured": True,
        "read_only_mode": True,
        "express_write_back": False,
        "counts": {},
        "errors": {},
        "last_sync_by_table": {},
        "failed_records": None,
        "historical_sync_status": sync_state.get_historical_status(),
        "active_rolling_status": sync_state.get_active_status(),
        "agent_runs_local": agent_local,
        "agent_runs_supabase": {},
        "read_model_refresh_status": agent_local.get("read_model_refresh"),
    }

    for label, table in COUNTS:
        count, err = head_count(client, table, ROOM)
        status["counts"][label] = count
        if err:
            status["errors"][label] = err

    by_table, table_err = latest_sync_by_table(client, ROOM)
    status["last_sync_by_table"] = by_table
    if table_err:
        status["errors"]["last_sync_by_table"] = table_err

    agent_jobs, agent_err = latest_agent_jobs(client)
    status["agent_runs_supabase"] = agent_jobs
    if agent_err:
        status["errors"]["agent_runs"] = agent_err

    failed, fail_err = failed_count(client, ROOM)
    status["failed_records"] = failed
    if fail_err:
        status["errors"]["sync_failed_records"] = fail_err
        if fail_err == SYNC_FAILED_RECORDS_MISSING:
            status["message"] = SYNC_FAILED_RECORDS_MISSING

    if by_table:
        latest = max(
            (row.get("finished_at") or row.get("started_at") for row in by_table.values()),
            default=None,
        )
        status["last_sync_time"] = latest
    else:
        status["last_sync_time"] = None
        if not status.get("message"):
            status["message"] = "Express sync status will appear after first readonly sync."

    for run_name in AGENT_RUNS:
        supabase_run = agent_jobs.get(run_name)
        local_run = agent_local.get(run_name)
        status[f"last_{run_name}"] = {
            "supabase": supabase_run,
            "local": local_run,
        }

    historical_done = all(
        item.get("completed") for item in status["historical_sync_status"].values()
    )
    status["historical_sync_completed"] = historical_done

    print(json.dumps(status, indent=2, ensure_ascii=False, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
