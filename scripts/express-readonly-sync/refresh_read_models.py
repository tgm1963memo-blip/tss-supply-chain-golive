#!/usr/bin/env python3
"""Refresh read-model health check and record agent run (views only — no raw table loads)."""
import json
import os
import sys
from datetime import datetime

from env_loader import ensure_sync_environment

ensure_sync_environment()

import express_table_mapping as config
import sync_state

try:
    from supabase import create_client
except ImportError:
    print(json.dumps({"error": "Install: pip install supabase python-dotenv"}, indent=2))
    sys.exit(1)

READ_MODEL_PROBES = [
    ("sc_express_products", "products_view"),
    ("sc_express_stock", "stock_view"),
    ("sc_express_so_headers", "so_headers_view"),
]


def probe_views(client):
    results = {}
    for table, label in READ_MODEL_PROBES:
        try:
            response = (
                client.from_(table)
                .select("*", count="exact")
                .limit(1)
                .execute()
            )
            results[label] = {"ok": True, "count": response.count}
        except Exception as exc:
            results[label] = {"ok": False, "error": str(exc)}
    return results


def record_supabase_agent_job(status, detail=None):
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return
    client = create_client(url, key)
    client.table("sync_jobs").insert({
        "room_code": "SYSTEM",
        "job_name": "agent:read_model_refresh",
        "source_table": "read_models",
        "status": status,
        "started_at": datetime.utcnow().isoformat(),
        "finished_at": datetime.utcnow().isoformat(),
        "last_error": detail if status != "completed" else None,
    }).execute()


def main():
    if os.getenv("READONLY_MODE", "true").lower() not in ("1", "true", "yes"):
        print("[BLOCKED] READONLY_MODE must be true.")
        return 1

    if not os.getenv("SUPABASE_URL") and not os.getenv("VITE_SUPABASE_URL"):
        print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.")
        sync_state.record_agent_run("read_model_refresh", "failed", "missing supabase env")
        return 1

    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = create_client(url, key)
    probes = probe_views(client)
    failed = [name for name, item in probes.items() if not item.get("ok")]
    status = "completed" if not failed else "completed_with_errors"
    detail = f"failed probes: {', '.join(failed)}" if failed else "read models reachable"

    sync_state.record_agent_run("read_model_refresh", status, detail)
    try:
        record_supabase_agent_job(status, detail if failed else None)
    except Exception as exc:
        print(f"[WARN] Could not write agent job to Supabase: {exc}")

    print(json.dumps({"status": status, "probes": probes, "detail": detail}, indent=2))
    return 0 if not failed else 2


if __name__ == "__main__":
    sys.exit(main())
