#!/usr/bin/env python3
"""Record automated sync agent run metadata (never prints secrets)."""
import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_ROOT = Path(__file__).resolve().parents[1]
if str(SCRIPT_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPT_ROOT))

from env_loader import ensure_sync_environment

ensure_sync_environment()

import sync_state

try:
    from supabase import create_client
except ImportError:
    print("[ERROR] pip install supabase python-dotenv")
    sys.exit(1)

JOB_NAMES = {
    "active_rolling": "agent:active_rolling",
    "master_daily": "agent:master_daily",
    "read_model_refresh": "agent:read_model_refresh",
    "historical_once": "agent:historical_once",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Record agent run status.")
    parser.add_argument("--run", required=True, choices=sorted(JOB_NAMES.keys()))
    parser.add_argument("--status", required=True, choices=["running", "completed", "failed", "completed_with_errors"])
    parser.add_argument("--detail", default="")
    return parser.parse_args()


def main():
    args = parse_args()
    sync_state.record_agent_run(args.run, args.status, args.detail)

    if not os.getenv("SUPABASE_URL") and not os.getenv("VITE_SUPABASE_URL"):
        print(f"[OK] Local agent run recorded: {args.run}={args.status}")
        return 0

    if not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        print(f"[OK] Local agent run recorded: {args.run}={args.status}")
        return 0

    try:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        client = create_client(url, os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
        client.table("sync_jobs").insert({
            "room_code": "SYSTEM",
            "job_name": JOB_NAMES[args.run],
            "source_table": args.run,
            "status": args.status,
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "last_error": args.detail if args.status in ("failed", "completed_with_errors") else None,
        }).execute()
        print(f"[OK] Agent run recorded: {args.run}={args.status}")
        return 0
    except Exception as exc:
        print(f"[WARN] Supabase agent job insert failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
