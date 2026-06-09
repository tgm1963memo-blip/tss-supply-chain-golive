#!/usr/bin/env python3
"""
Express read-only sync entry point (Phase 3G).

Rules enforced:
- READ Express DBF files only (copy to local cache, never write back to DBF)
- WRITE to Supabase staging/raw tables only (sc_express_*)
- NO Express DBF write-back, NO stock posting, NO ERP mutation
"""
import os
import sys

from env_loader import ensure_sync_environment, print_startup_diagnostics

ensure_sync_environment()

from express_table_mapping import READONLY_MODE

readonly_env = os.getenv("READONLY_MODE", "true").lower() in ("1", "true", "yes")
if not READONLY_MODE or not readonly_env:
    print("[FATAL] EXPRESS sync must run in READONLY_MODE=true")
    sys.exit(1)

print("[READONLY] Express DBF read-only sync — no write-back to Express ERP")
print("[READONLY] Target: Supabase sc_express_* staging tables only")
print_startup_diagnostics()

from express_sync_engine import main

if __name__ == "__main__":
    raise SystemExit(main())
