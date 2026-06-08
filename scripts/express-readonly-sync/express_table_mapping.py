"""Express DBF → Supabase table mapping (read-only sync)."""
import os
from pathlib import Path

# Read-only sync — DBF files are never modified by these scripts.
READONLY_MODE = True

ACTIVE_ROOMS = ["TSS", "TSS_NV", "CONSI", "TGM"]
ARCHIVE_ROOMS = ["TSS_67", "TSS_68", "TSSN_67", "TSSN_68"]

# UAT scope tables (Phase 3G)
UAT_DBF_TABLES = [
    "STMAS.DBF",
    "ARMAS.DBF",
    "STLOC.DBF",
    "OESO.DBF",
    "OESOIT.DBF",
    "ARTRN.DBF",
]

DBF_TABLES = UAT_DBF_TABLES + ["STTRN.DBF"]

PRIMARY_ENCODING = "cp874"
FALLBACK_ENCODING = "tis-620"

# EXPRESS_DBF_PATH = room folder root, e.g. \\server\expsrv\ExpressI\TSS
# ERP_BASE_PATH = parent ExpressI folder (legacy compat)
_express_room_root = os.getenv("EXPRESS_DBF_PATH", "").strip()
_erp_base = os.getenv("ERP_BASE_PATH", r"\\server\expsrv\ExpressI")
SYNC_ROOM_CODE = os.getenv("SYNC_ROOM_CODE", "TSS")

if _express_room_root:
    ERP_BASE_PATH = Path(_express_room_root).parent
    ROOM_DBF_ROOT = Path(_express_room_root)
else:
    ERP_BASE_PATH = Path(_erp_base)
    ROOM_DBF_ROOT = None

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SYNC_BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "500"))

SCRIPT_DIR = Path(__file__).resolve().parent
DBF_TEMP_CACHE_PATH = SCRIPT_DIR / "cache" / "dbf_temp"
FAILED_RECORDS_CACHE_PATH = SCRIPT_DIR / "cache" / "failed_records"

DBF_TARGET_TABLES = {
    "STMAS.DBF": "sc_express_products",
    "STLOC.DBF": "sc_express_stock",
    "ARMAS.DBF": "sc_express_customers",
    "OESO.DBF": "sc_express_so_headers",
    "OESOIT.DBF": "sc_express_so_lines",
    "ARTRN.DBF": "sc_express_invoices",
    "STTRN.DBF": "sc_express_transfers",
}

UPSERT_CONFLICT_KEYS = {
    "sc_express_products": "room_code,product_code",
    "sc_express_stock": "room_code,product_code,warehouse_code,location_code,lot_no",
    "sc_express_customers": "room_code,customer_code",
    "sc_express_so_headers": "room_code,document_no",
    "sc_express_so_lines": "room_code,document_no,line_no",
    "sc_express_invoices": "room_code,document_no",
    "sc_express_transfers": "room_code,document_no",
}

# Golive page mapping (documentation reference)
GOLIVE_PAGE_MAPPING = {
    "STMAS.DBF": "Product Master",
    "ARMAS.DBF": "Customer Master",
    "STLOC.DBF": "Stock Balance",
    "OESO.DBF": "Sales Order (header)",
    "OESOIT.DBF": "Sales Order (lines)",
    "ARTRN.DBF": "Sales / Invoice history",
}

LARGE_TRANSACTION_TABLES = ["OESOIT.DBF", "OESO.DBF", "ARTRN.DBF", "STTRN.DBF"]


def get_room_path(room_code):
    if ROOM_DBF_ROOT and room_code == SYNC_ROOM_CODE:
        return ROOM_DBF_ROOT
    if room_code not in ACTIVE_ROOMS and room_code not in ARCHIVE_ROOMS:
        raise ValueError(f"Unknown ERP room: {room_code}")
    return ERP_BASE_PATH / room_code


def get_dbf_path(room_code, table_name):
    normalized_table_name = table_name.upper()
    if normalized_table_name not in DBF_TABLES:
        raise ValueError(f"Unknown DBF table: {table_name}")
    return get_room_path(room_code) / normalized_table_name
