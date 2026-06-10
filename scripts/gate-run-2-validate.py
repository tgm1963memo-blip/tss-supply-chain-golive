#!/usr/bin/env python3
"""Gate Run 2 validation — row counts, view existence, anon read probes."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYNC_DIR = ROOT / "scripts" / "express-readonly-sync"

try:
    from dotenv import load_dotenv
except ImportError:
    print(json.dumps({"error": "pip install python-dotenv supabase"}))
    sys.exit(1)

load_dotenv(ROOT / ".env.local")
load_dotenv(SYNC_DIR / ".env", override=False)

try:
    from supabase import create_client
except ImportError:
    print(json.dumps({"error": "pip install supabase"}))
    sys.exit(1)

URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
SVC_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ROOM = os.getenv("SYNC_ROOM_CODE", "TSS")

STAGING_TABLES = [
    "sc_express_products",
    "sc_express_customers",
    "sc_express_stock",
    "sc_express_so_headers",
    "sc_express_so_lines",
    "sc_express_invoices",
    "sc_express_transfers",
]

REQUIRED_VIEWS = [
    "sc_web_customer_master_view",
    "sc_so_reservation_candidate_view",
    "sc_web_atp_view",
    "sc_web_stock_balance_view",
    "sc_web_sku_admin_view",
    "sc_web_product_master_view",
    "sc_web_consi_branch_stock_view",
]

PAGE_PROBES = [
    ("Product Master", "sc_web_product_master_view"),
    ("Customer Registration", "sc_web_customer_master_view"),
    ("Sales Overview / SO candidates", "sc_so_reservation_candidate_view"),
    ("Stock Balance", "sc_inventory_balance_view"),
    ("ATP Workbench", "sc_web_atp_view"),
    ("WMS Dashboard", "sc_web_stock_balance_view"),
    ("SKU Admin", "sc_web_sku_admin_view"),
]

SERVICE_VIEW_REFS = [
    ("reservationSourceService", "sc_so_reservation_candidate_view"),
    ("atpWorkbenchService", "sc_web_atp_view"),
    ("wmsDashboardService", "sc_web_stock_balance_view"),
    ("customerRegistrationService", "sc_web_customer_master_view"),
    ("productMasterService", "sc_web_product_master_view"),
]


def count_table(client, table, room_code=None, use_service=False):
    try:
        query = client.from_(table).select("*", count="exact").limit(1)
        if room_code:
            query = query.eq("room_code", room_code)
        response = query.execute()
        return {"ok": True, "count": response.count}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def probe_view(client, table):
    try:
        response = client.from_(table).select("*", count="exact").limit(1).execute()
        return {"ok": True, "count": response.count, "has_sample": bool(response.data)}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def check_service_refs():
    src = ROOT / "src" / "services"
    missing = []
    for label, view in SERVICE_VIEW_REFS:
        hits = list(src.rglob("*.js"))
        found = any(view in hit.read_text(encoding="utf-8") for hit in hits if hit.is_file())
        if not found:
            missing.append({"service_hint": label, "view": view, "issue": "view string not found in services"})
    return missing


def run_conflict_key_guard():
    script = SYNC_DIR / "validate_upsert_conflict_keys.py"
    if not script.exists():
        return {"ok": False, "error": "validate_upsert_conflict_keys.py missing"}
    proc = subprocess.run(
        [sys.executable, str(script)],
        cwd=str(SYNC_DIR),
        capture_output=True,
        text=True,
    )
    try:
        payload = json.loads(proc.stdout.strip() or "{}")
    except json.JSONDecodeError:
        payload = {"ok": False, "stdout": proc.stdout, "stderr": proc.stderr}
    payload["exit_code"] = proc.returncode
    return payload


def main():
    result = {
        "configured": bool(URL and ANON_KEY),
        "room_code": ROOM,
        "conflict_key_guard": run_conflict_key_guard(),
        "service_view_refs": check_service_refs(),
        "staging_counts_service": {},
        "staging_counts_anon": {},
        "required_views_anon": {},
        "page_probes_anon": {},
        "blockers": [],
    }

    if not URL or not ANON_KEY:
        result["blockers"].append("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
        print(json.dumps(result, indent=2))
        return 1

    anon = create_client(URL, ANON_KEY)
    svc = create_client(URL, SVC_KEY) if SVC_KEY else None

    if svc:
        for table in STAGING_TABLES:
            result["staging_counts_service"][table] = count_table(svc, table, ROOM)

    for table in STAGING_TABLES:
        result["staging_counts_anon"][table] = count_table(anon, table, ROOM)

    for view in REQUIRED_VIEWS:
        result["required_views_anon"][view] = probe_view(anon, view)

    for label, view in PAGE_PROBES:
        result["page_probes_anon"][label] = {"view": view, **probe_view(anon, view)}

    if result["conflict_key_guard"].get("ok") is not True:
        result["blockers"].append("UPSERT conflict key guard failed")

    for view, probe in result["required_views_anon"].items():
        if not probe.get("ok"):
            result["blockers"].append(f"Missing or inaccessible view: {view}")

    anon_products = result["staging_counts_anon"].get("sc_express_products", {})
    if anon_products.get("ok") and (anon_products.get("count") or 0) == 0:
        svc_count = (result["staging_counts_service"].get("sc_express_products") or {}).get("count")
        if svc_count and svc_count > 0:
            result["blockers"].append("Anon cannot read sc_express_products despite service role data")

    product_probe = result["page_probes_anon"].get("Product Master", {})
    if not product_probe.get("ok") or (product_probe.get("count") or 0) == 0:
        result["blockers"].append("Product Master view has no anon-readable rows")

    customer_probe = result["page_probes_anon"].get("Customer Registration", {})
    if not customer_probe.get("ok"):
        result["blockers"].append("Customer Registration view not accessible")

    sales_probe = result["page_probes_anon"].get("Sales Overview / SO candidates", {})
    if not sales_probe.get("ok"):
        result["blockers"].append("Sales reservation candidate view not accessible")

    result["recommendation"] = "GO" if not result["blockers"] else "NO-GO"
    print(json.dumps(result, indent=2))
    return 0 if result["recommendation"] == "GO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
