"""Express DBF → Supabase table mapping (read-only sync)."""
import os
from pathlib import Path

# Read-only sync — DBF files are never modified by these scripts.
READONLY_MODE = True

# Active rooms (rolling sync)
ACTIVE_ROOMS = ["TSS", "TSS-NV", "CONSI"]

# Historical one-time full sync rooms
HISTORICAL_ROOMS = ["TSSN-68", "TSS-68", "TSSN-67", "TSS-67"]

# Legacy aliases (management project naming)
ARCHIVE_ROOMS = HISTORICAL_ROOMS
LEGACY_ACTIVE_ROOMS = ["TSS", "TSS_NV", "CONSI", "TGM"]

# DBF folder names on \\server\expsrv\ExpressI\{folder}
ROOM_FOLDER_CANDIDATES = {
    "TSS": ["TSS"],
    "TSS-NV": ["TSS_NV", "TSS-NV", "TSSNV"],
    "CONSI": ["CONSI"],
    "TSSN-68": ["TSSN_68", "TSSN-68", "TSSN68"],
    "TSS-68": ["TSS_68", "TSS-68", "TSS68"],
    "TSSN-67": ["TSSN_67", "TSSN-67", "TSSN67"],
    "TSS-67": ["TSS_67", "TSS-67", "TSS67"],
}

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


def reload_from_env():
    """Re-read environment variables after dotenv load."""
    global _express_room_root, ERP_BASE_PATH, ROOM_DBF_ROOT, SYNC_ROOM_CODE
    global SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SYNC_BATCH_SIZE

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


def normalize_room_code(room_code):
    aliases = {
        "TSS_NV": "TSS-NV",
        "TSSNV": "TSS-NV",
        "TSSN_68": "TSSN-68",
        "TSS_68": "TSS-68",
        "TSSN_67": "TSSN-67",
        "TSS_67": "TSS-67",
    }
    code = str(room_code or "").strip()
    return aliases.get(code, code)


def resolve_room_folder(room_code):
    normalized = normalize_room_code(room_code)
    candidates = ROOM_FOLDER_CANDIDATES.get(normalized, [normalized, room_code])
    for folder in candidates:
        path = ERP_BASE_PATH / folder
        if path.exists():
            return path, folder
    return ERP_BASE_PATH / candidates[0], candidates[0]


def get_room_path(room_code):
    normalized = normalize_room_code(room_code)
    if ROOM_DBF_ROOT and normalized == normalize_room_code(SYNC_ROOM_CODE):
        return ROOM_DBF_ROOT
    allowed = set(ACTIVE_ROOMS + HISTORICAL_ROOMS + LEGACY_ACTIVE_ROOMS)
    if normalized not in allowed and room_code not in allowed:
        raise ValueError(f"Unknown ERP room: {room_code}")
    folder_path, _folder = resolve_room_folder(normalized)
    return folder_path


def get_dbf_path(room_code, table_name):
    normalized_table_name = table_name.upper()
    if normalized_table_name not in DBF_TABLES:
        raise ValueError(f"Unknown DBF table: {table_name}")
    return get_room_path(room_code) / normalized_table_name
