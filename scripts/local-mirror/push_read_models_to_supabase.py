#!/usr/bin/env python3
"""Push compact local read models to Supabase sc_rm_* tables (service role — backend only)."""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
EXPRESS_SYNC_DIR = SCRIPT_DIR.parent / "express-readonly-sync"
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(EXPRESS_SYNC_DIR))

from dotenv import load_dotenv
from supabase import create_client

from local_mirror_config import (
    ENV_FILE_ORDER,
    LOCAL_READ_MODEL_TABLES,
    READONLY_MODE,
    SUPABASE_RM_CONFLICT_KEYS,
    SYNC_BATCH_SIZE,
)
from local_mirror_db import LocalMirrorDB
from safe_dbf_parser import safe_print


def load_environment() -> None:
    for path in ENV_FILE_ORDER:
        if path.exists():
            load_dotenv(path, override=True)


def assert_backend_only() -> None:
    if not READONLY_MODE:
        raise RuntimeError("READONLY_MODE must be true.")
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in scripts/local-mirror/.env "
            "or scripts/express-readonly-sync/.env — never in frontend."
        )


def create_supabase_client():
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def fetch_local_rows(db: LocalMirrorDB, local_table: str) -> list[dict]:
    return db.fetchall(f"select * from {local_table}")


def chunk(rows: list[dict], size: int):
    for i in range(0, len(rows), size):
        yield rows[i : i + size]


def push_table(
    supabase,
    local_table: str,
    target_table: str,
    rows: list[dict],
    *,
    batch_size: int,
    dry_run: bool,
) -> dict:
    conflict_keys = SUPABASE_RM_CONFLICT_KEYS.get(target_table)
    pushed = 0
    batches = 0

    for batch in chunk(rows, batch_size):
        batches += 1
        if dry_run:
            pushed += len(batch)
            continue
        if conflict_keys:
            supabase.table(target_table).upsert(batch, on_conflict=conflict_keys).execute()
        else:
            supabase.table(target_table).upsert(batch).execute()
        pushed += len(batch)

    return {
        "local_table": local_table,
        "target_table": target_table,
        "row_count": len(rows),
        "rows_pushed": pushed,
        "batches": batches,
        "dry_run": dry_run,
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Push local compact read models to Supabase.")
    parser.add_argument("--model", help="Single local read model e.g. rm_product_master")
    parser.add_argument("--batch-size", type=int, default=SYNC_BATCH_SIZE)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    load_environment()
    assert_backend_only()
    args = parse_args()

    targets = (
        {args.model: LOCAL_READ_MODEL_TABLES[args.model]}
        if args.model
        else LOCAL_READ_MODEL_TABLES
    )

    if args.model and args.model not in LOCAL_READ_MODEL_TABLES:
        raise SystemExit(f"Unknown model: {args.model}")

    supabase = None if args.dry_run else create_supabase_client()
    results = []

    with LocalMirrorDB() as db:
        for local_table, target_table in targets.items():
            rows = fetch_local_rows(db, local_table)
            safe_print(f"[PUSH-RM] {local_table} -> {target_table}: {len(rows)} rows")
            result = push_table(
                supabase,
                local_table,
                target_table,
                rows,
                batch_size=args.batch_size,
                dry_run=args.dry_run,
            )
            results.append(result)
            safe_print(f"  pushed={result['rows_pushed']} batches={result['batches']}")

    log_path = SCRIPT_DIR / "logs" / f"push_rm_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    import json

    log_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    safe_print(f"[PUSH-RM] summary: {log_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
