#!/usr/bin/env python3
"""
Express read-only sync entry point (Phase 3G).

Rules enforced:
- READ Express DBF files only (copy to local cache, never write back to DBF)
- WRITE to Supabase staging/raw tables only (sc_express_*)
- NO Express DBF write-back, NO stock posting, NO ERP mutation
"""
import sys

from express_table_mapping import READONLY_MODE

if not READONLY_MODE:
    print("[FATAL] EXPRESS sync must run in READONLY_MODE=true")
    sys.exit(1)

print("[READONLY] Express DBF read-only sync — no write-back to Express ERP")
print("[READONLY] Target: Supabase sc_express_* staging tables only")

from express_sync_engine import main

if __name__ == "__main__":
    raise SystemExit(main())
