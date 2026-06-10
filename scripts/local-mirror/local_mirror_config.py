"""Configuration for local Express mirror (read-only, no Express write-back)."""
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
EXPRESS_SYNC_DIR = SCRIPT_DIR.parent / "express-readonly-sync"

DATA_DIR = SCRIPT_DIR / "data"
LOGS_DIR = SCRIPT_DIR / "logs"
CACHE_DIR = SCRIPT_DIR / "cache"

READONLY_MODE = True

PRIMARY_ENCODING = "cp874"
FALLBACK_ENCODING = "tis-620"

SYNC_BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "500"))
LOCAL_MIRROR_BATCH_SIZE = int(os.getenv("LOCAL_MIRROR_BATCH_SIZE", "1000"))

# Prefer DuckDB; SQLite fallback when duckdb is not installed.
DUCKDB_PATH = DATA_DIR / "express_mirror.duckdb"
SQLITE_PATH = DATA_DIR / "express_mirror.sqlite"

DBF_LOCAL_TABLES = {
    "STMAS.DBF": "local_express_products",
    "ARMAS.DBF": "local_express_customers",
    "STLOC.DBF": "local_express_stock",
    "OESO.DBF": "local_express_so_headers",
    "OESOIT.DBF": "local_express_so_lines",
    "ARTRN.DBF": "local_express_invoices",
    "STTRN.DBF": "local_express_transfers",
}

LOCAL_READ_MODEL_TABLES = {
    "rm_product_master": "sc_rm_product_master",
    "rm_customer_master": "sc_rm_customer_master",
    "rm_stock_balance": "sc_rm_stock_balance",
    "rm_open_so_headers": "sc_rm_open_so_headers",
    "rm_open_so_lines": "sc_rm_open_so_lines",
    "rm_sales_daily_summary": "sc_rm_sales_daily_summary",
    "rm_sales_monthly_summary": "sc_rm_sales_monthly_summary",
    "rm_consi_branch_stock": "sc_rm_consi_branch_stock",
}

SUPABASE_RM_CONFLICT_KEYS = {
    "sc_rm_product_master": "room_code,product_code",
    "sc_rm_customer_master": "room_code,customer_code",
    "sc_rm_stock_balance": "room_code,product_code,warehouse_code,location_code,lot_no",
    "sc_rm_open_so_headers": "room_code,document_no",
    "sc_rm_open_so_lines": "room_code,document_no,line_no",
    "sc_rm_sales_daily_summary": "room_code,sales_date,customer_code,product_code",
    "sc_rm_sales_monthly_summary": "room_code,sales_month,customer_code,product_code",
    "sc_rm_consi_branch_stock": "room_code,customer_code,branch_code,product_code",
}

OPEN_SO_STATUS_BLOCKLIST = {"closed", "cancelled", "complete", "completed", "void", "deleted"}

ENV_FILE_ORDER = [
    SCRIPT_DIR / ".env",
    SCRIPT_DIR / ".env.local",
    EXPRESS_SYNC_DIR / ".env",
    EXPRESS_SYNC_DIR / ".env.local",
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / ".env.local",
]
