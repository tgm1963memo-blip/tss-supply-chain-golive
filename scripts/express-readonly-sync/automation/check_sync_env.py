#!/usr/bin/env python3
"""Validate Express sync agent environment (never prints secret values)."""
import os
import sys
from pathlib import Path

SCRIPT_ROOT = Path(__file__).resolve().parents[1]
if str(SCRIPT_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPT_ROOT))

from env_loader import ensure_sync_environment, print_startup_diagnostics

ensure_sync_environment()

import express_table_mapping as config

REQUIRED_TABLES = list(config.UAT_DBF_TABLES)

def check_readonly_mode():
    value = os.getenv("READONLY_MODE", "true").lower()
    return value in ("1", "true", "yes"), value


def check_dbf_path():
    path_value = os.getenv("EXPRESS_DBF_PATH") or os.getenv("ERP_BASE_PATH") or str(config.ERP_BASE_PATH)
    path = Path(path_value)
    if not path.exists():
        return False, f"Path not accessible: {path}"
    dbf_files = list(path.glob("*.DBF")) + list(path.glob("*.dbf"))
    if not dbf_files:
        return False, f"No DBF files found under {path}"
    return True, f"Found {len(dbf_files)} DBF file(s) under {path}"


def main():
    errors = []
    warnings = []

    print_startup_diagnostics()

    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        errors.append("SUPABASE_URL is missing")
    if not key:
        errors.append("SUPABASE_SERVICE_ROLE_KEY is missing")

    express_path = os.getenv("EXPRESS_DBF_PATH", "")
    if not express_path:
        warnings.append("EXPRESS_DBF_PATH not set — will use ERP_BASE_PATH room folders")
        print(f"EXPRESS_DBF_PATH: (not set, ERP_BASE_PATH={config.ERP_BASE_PATH})")
    else:
        print(f"EXPRESS_DBF_PATH: {express_path}")

    readonly_ok, readonly_value = check_readonly_mode()
    if not readonly_ok:
        errors.append(f"READONLY_MODE must be true (current: {readonly_value})")
    else:
        print("READONLY_MODE: true")

    dbf_ok, dbf_message = check_dbf_path()
    print(f"DBF check: {dbf_message}")
    if not dbf_ok:
        errors.append(dbf_message)

    for table in REQUIRED_TABLES:
        candidates = [config.ERP_BASE_PATH / config.normalize_room_code(config.SYNC_ROOM_CODE) / table]
        if config.ROOM_DBF_ROOT:
            candidates.insert(0, config.ROOM_DBF_ROOT / table)
        found = any(path.exists() for path in candidates)
        if not found:
            warnings.append(f"Sample table not found locally: {table}")

    for warning in warnings:
        print(f"[WARN] {warning}")

    if errors:
        for error in errors:
            print(f"[ERROR] {error}")
        return 1

    print("[OK] Sync environment validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
