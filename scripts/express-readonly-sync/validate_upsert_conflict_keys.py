#!/usr/bin/env python3
"""Validate Express sync UPSERT conflict keys match documented DB constraints."""
import json
import sys
from pathlib import Path

import express_table_mapping as config

# Keep in sync with supabase/migrations unique constraints / 011_gate_fix_sync_read_models.sql
EXPECTED_CONFLICT_KEYS = {
    "sc_express_products": "room_code,product_code",
    "sc_express_stock": "room_code,product_code,warehouse_code,location_code,lot_no",
    "sc_express_customers": "room_code,customer_code",
    "sc_express_so_headers": "room_code,document_no",
    "sc_express_so_lines": "room_code,document_no,line_no",
    "sc_express_invoices": "room_code,document_no,line_no",
    "sc_express_transfers": "room_code,document_no",
}


def main():
    mismatches = []
    for table, expected in EXPECTED_CONFLICT_KEYS.items():
        actual = config.UPSERT_CONFLICT_KEYS.get(table)
        if actual != expected:
            mismatches.append({
                "table": table,
                "expected": expected,
                "actual": actual,
            })

    if mismatches:
        print(json.dumps({"ok": False, "mismatches": mismatches}, indent=2))
        return 1

    print(json.dumps({"ok": True, "tables_checked": len(EXPECTED_CONFLICT_KEYS)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
