"""Local mirror database layer — DuckDB preferred, SQLite fallback."""
from __future__ import annotations

import hashlib
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from local_mirror_config import DATA_DIR, DUCKDB_PATH, SQLITE_PATH

try:
    import duckdb

    HAS_DUCKDB = True
except ImportError:
    duckdb = None
    HAS_DUCKDB = False


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_data_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_engine_name() -> str:
    return "duckdb" if HAS_DUCKDB else "sqlite"


def get_db_path() -> Path:
    return DUCKDB_PATH if HAS_DUCKDB else SQLITE_PATH


def deterministic_source_id(source_table: str, key_parts: list[Any]) -> str:
    payload = "|".join([source_table, *[str(p or "") for p in key_parts]])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]


class LocalMirrorDB:
    """Thin wrapper over DuckDB or SQLite for local mirror tables."""

    def __init__(self, db_path: Path | None = None):
        ensure_data_dirs()
        self.engine = get_engine_name()
        self.db_path = db_path or get_db_path()
        self._conn = None

    def connect(self):
        if self._conn is not None:
            return self._conn
        if self.engine == "duckdb":
            self._conn = duckdb.connect(str(self.db_path))
        else:
            self._conn = sqlite3.connect(str(self.db_path))
            self._conn.row_factory = sqlite3.Row
        self.ensure_schema()
        return self._conn

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    def execute(self, sql: str, params: tuple | list | None = None):
        conn = self.connect()
        if params is None:
            return conn.execute(sql)
        return conn.execute(sql, params)

    def executemany(self, sql: str, rows: list[tuple]):
        conn = self.connect()
        return conn.executemany(sql, rows)

    def commit(self) -> None:
        if self._conn is not None:
            self._conn.commit()

    def fetchall(self, sql: str, params: tuple | list | None = None) -> list[dict]:
        cursor = self.execute(sql, params)
        if self.engine == "duckdb":
            cols = [d[0] for d in cursor.description]
            return [dict(zip(cols, row)) for row in cursor.fetchall()]
        return [dict(row) for row in cursor.fetchall()]

    def fetchone_scalar(self, sql: str, params: tuple | list | None = None):
        rows = self.fetchall(sql, params)
        if not rows:
            return None
        return next(iter(rows[0].values()))

    def table_exists(self, table_name: str) -> bool:
        if self.engine == "duckdb":
            sql = "select count(*) from information_schema.tables where table_name = ?"
        else:
            sql = "select count(*) from sqlite_master where type='table' and name = ?"
        return bool(self.fetchone_scalar(sql, (table_name,)))

    def ensure_schema(self) -> None:
        raw_type = "JSON" if self.engine == "duckdb" else "TEXT"
        ts_default = "CURRENT_TIMESTAMP"

        mirror_ddl = f"""
        CREATE TABLE IF NOT EXISTS local_express_products (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            product_code TEXT,
            product_name TEXT,
            product_group TEXT,
            unit_code TEXT,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_customers (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            customer_code TEXT,
            customer_name TEXT,
            customer_group TEXT,
            tax_id TEXT,
            sales_code TEXT,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_stock (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            product_code TEXT,
            warehouse_code TEXT,
            location_code TEXT,
            lot_no TEXT,
            qty_on_hand REAL,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_so_headers (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            document_no TEXT,
            customer_code TEXT,
            document_date TEXT,
            delivery_date TEXT,
            status TEXT,
            total_amount REAL,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_so_lines (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            document_no TEXT,
            line_no INTEGER,
            product_code TEXT,
            order_qty REAL,
            shipped_qty REAL,
            status TEXT,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_invoices (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            document_no TEXT,
            line_no INTEGER,
            customer_code TEXT,
            product_code TEXT,
            invoice_date TEXT,
            sales_qty REAL,
            sales_amount REAL,
            status TEXT,
            PRIMARY KEY (room_code, source_row_id)
        );

        CREATE TABLE IF NOT EXISTS local_express_transfers (
            room_code TEXT NOT NULL,
            source_table TEXT NOT NULL,
            source_row_id TEXT NOT NULL,
            raw_data {raw_type},
            synced_at TEXT DEFAULT {ts_default},
            document_no TEXT,
            from_warehouse_code TEXT,
            to_warehouse_code TEXT,
            transfer_date TEXT,
            status TEXT,
            PRIMARY KEY (room_code, source_row_id)
        );
        """

        read_model_ddl = f"""
        CREATE TABLE IF NOT EXISTS rm_product_master (
            room_code TEXT NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT,
            product_group TEXT,
            category TEXT,
            unit_code TEXT,
            barcode TEXT,
            active_status TEXT,
            synced_at TEXT,
            PRIMARY KEY (room_code, product_code)
        );

        CREATE TABLE IF NOT EXISTS rm_customer_master (
            room_code TEXT NOT NULL,
            customer_code TEXT NOT NULL,
            customer_name TEXT,
            tax_id TEXT,
            customer_group TEXT,
            channel TEXT,
            phone TEXT,
            address TEXT,
            active_status TEXT,
            synced_at TEXT,
            PRIMARY KEY (room_code, customer_code)
        );

        CREATE TABLE IF NOT EXISTS rm_stock_balance (
            room_code TEXT NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT,
            warehouse_code TEXT NOT NULL DEFAULT '',
            location_code TEXT NOT NULL DEFAULT '',
            lot_no TEXT NOT NULL DEFAULT '',
            qty_on_hand REAL DEFAULT 0,
            qty_reserved REAL DEFAULT 0,
            qty_available REAL DEFAULT 0,
            synced_at TEXT,
            PRIMARY KEY (room_code, product_code, warehouse_code, location_code, lot_no)
        );

        CREATE TABLE IF NOT EXISTS rm_open_so_headers (
            room_code TEXT NOT NULL,
            document_no TEXT NOT NULL,
            document_date TEXT,
            customer_code TEXT,
            customer_name TEXT,
            status TEXT,
            ship_date TEXT,
            total_amount REAL DEFAULT 0,
            synced_at TEXT,
            PRIMARY KEY (room_code, document_no)
        );

        CREATE TABLE IF NOT EXISTS rm_open_so_lines (
            room_code TEXT NOT NULL,
            document_no TEXT NOT NULL,
            line_no INTEGER NOT NULL,
            product_code TEXT,
            product_name TEXT,
            order_qty REAL DEFAULT 0,
            shipped_qty REAL DEFAULT 0,
            remaining_qty REAL DEFAULT 0,
            warehouse_code TEXT,
            ship_date TEXT,
            status TEXT,
            synced_at TEXT,
            PRIMARY KEY (room_code, document_no, line_no)
        );

        CREATE TABLE IF NOT EXISTS rm_sales_daily_summary (
            room_code TEXT NOT NULL,
            sales_date TEXT NOT NULL,
            customer_code TEXT NOT NULL DEFAULT '',
            customer_name TEXT,
            product_code TEXT NOT NULL DEFAULT '',
            product_name TEXT,
            product_group TEXT,
            sales_qty REAL DEFAULT 0,
            sales_amount REAL DEFAULT 0,
            invoice_count INTEGER DEFAULT 0,
            synced_at TEXT,
            PRIMARY KEY (room_code, sales_date, customer_code, product_code)
        );

        CREATE TABLE IF NOT EXISTS rm_sales_monthly_summary (
            room_code TEXT NOT NULL,
            sales_month TEXT NOT NULL,
            customer_code TEXT NOT NULL DEFAULT '',
            customer_name TEXT,
            product_code TEXT NOT NULL DEFAULT '',
            product_name TEXT,
            product_group TEXT,
            sales_qty REAL DEFAULT 0,
            sales_amount REAL DEFAULT 0,
            invoice_count INTEGER DEFAULT 0,
            synced_at TEXT,
            PRIMARY KEY (room_code, sales_month, customer_code, product_code)
        );

        CREATE TABLE IF NOT EXISTS rm_consi_branch_stock (
            room_code TEXT NOT NULL,
            customer_code TEXT NOT NULL DEFAULT '',
            customer_name TEXT,
            branch_code TEXT NOT NULL DEFAULT '',
            branch_name TEXT,
            product_code TEXT NOT NULL DEFAULT '',
            product_name TEXT,
            qty_on_branch REAL DEFAULT 0,
            qty_sold REAL DEFAULT 0,
            qty_returned REAL DEFAULT 0,
            synced_at TEXT,
            PRIMARY KEY (room_code, customer_code, branch_code, product_code)
        );
        """

        for stmt in (mirror_ddl + read_model_ddl).split(";"):
            sql = stmt.strip()
            if sql:
                self.execute(sql)
        self.commit()

    def upsert_mirror_rows(self, table_name: str, rows: list[dict]) -> int:
        if not rows:
            return 0
        columns = list(rows[0].keys())
        placeholders = ", ".join(["?"] * len(columns))
        col_list = ", ".join(columns)
        if self.engine == "duckdb":
            update_cols = [c for c in columns if c not in ("room_code", "source_row_id")]
            set_clause = ", ".join(f"{c}=excluded.{c}" for c in update_cols)
            sql = (
                f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders}) "
                f"ON CONFLICT (room_code, source_row_id) DO UPDATE SET {set_clause}"
            )
        else:
            sql = (
                f"INSERT OR REPLACE INTO {table_name} ({col_list}) VALUES ({placeholders})"
            )
        payload = [tuple(self._serialize_value(row.get(c)) for c in columns) for row in rows]
        self.executemany(sql, payload)
        self.commit()
        return len(rows)

    def replace_read_model(self, table_name: str, rows: list[dict]) -> int:
        self.execute(f"DELETE FROM {table_name}")
        if not rows:
            self.commit()
            return 0
        columns = list(rows[0].keys())
        placeholders = ", ".join(["?"] * len(columns))
        col_list = ", ".join(columns)
        sql = f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})"
        payload = [tuple(self._serialize_value(row.get(c)) for c in columns) for row in rows]
        self.executemany(sql, payload)
        self.commit()
        return len(rows)

    @staticmethod
    def _serialize_value(value: Any):
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False, default=str)
        return value

    @contextmanager
    def transaction(self) -> Iterator["LocalMirrorDB"]:
        try:
            yield self
            self.commit()
        except Exception:
            if self._conn is not None:
                self._conn.rollback()
            raise
