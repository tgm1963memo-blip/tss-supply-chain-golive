"""
Express DBF → Supabase sync engine (read-only toward Express).
Adapted from tss-supply-chain-management/sync_scripts/sync_express.py
"""
import argparse
import json
import os
import re
import shutil
import sys
import time
import traceback
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from dbfread import DBF
from supabase import create_client

from env_loader import ensure_sync_environment

ensure_sync_environment()

import express_table_mapping as config
from safe_dbf_parser import (
    INVALID_DATE_COUNTS,
    SafeFieldParser,
    clean_record,
    get_first,
    safe_print,
    to_number,
)
from sync_policy import (
    get_policy_config,
    get_policy_date_window,
    get_policy_group,
    get_record_policy_date,
    is_active_order_record,
    parse_cli_date,
)


class FatalSupabaseSpaceError(RuntimeError):
    pass


def get_stock_qty_on_hand(raw_record):
    return to_number(get_first(
        raw_record,
        "LOCBAL",
        "MREMBAL",
        "BALANCE",
        "QTY",
        "QTY_ON_HAND",
    ))


def map_record(room_code, table_name, raw_record):
    table_name = table_name.upper()
    target_table = config.DBF_TARGET_TABLES[table_name]

    common = {
        "room_code": room_code,
        "raw_data": raw_record,
    }

    if table_name == "STMAS.DBF":
        return target_table, {
            **common,
            "product_code": get_first(raw_record, "STKCOD", "STK_CODE", "CODE"),
            "product_name": get_first(raw_record, "STKDES", "STK_NAME", "NAME"),
            "product_description": get_first(raw_record, "STKDES2", "STKDES", "DESCRIPTION"),
            "product_group": get_first(raw_record, "STKGRP", "GROUP_CODE"),
            "uom": get_first(raw_record, "QUCOD", "UOM"),
            "source_updated_at": get_first(raw_record, "UPDDAT", "UPDATED_AT"),
        }

    if table_name == "STLOC.DBF":
        return target_table, {
            **common,
            "product_code": get_first(raw_record, "STKCOD", "STK_CODE"),
            "warehouse_code": get_first(raw_record, "LOCCOD", "WAREHOUSE", "WHCODE"),
            "location_code": get_first(raw_record, "LOCCOD", "LOCATION"),
            "lot_no": get_first(raw_record, "LOTNO", "LOT"),
            "qty_on_hand": get_stock_qty_on_hand(raw_record),
            "source_updated_at": get_first(raw_record, "UPDDAT", "UPDATED_AT"),
        }

    if table_name == "ARMAS.DBF":
        return target_table, {
            **common,
            "customer_code": get_first(raw_record, "CUSCOD", "AR_CODE", "CODE"),
            "customer_name": get_first(raw_record, "SNAM", "CUSNAM", "NAME"),
            "customer_group": get_first(raw_record, "CUSGRP", "GROUP_CODE"),
            "sales_code": get_first(raw_record, "SLMCOD", "SALE_CODE"),
            "source_updated_at": get_first(raw_record, "UPDDAT", "UPDATED_AT"),
        }

    if table_name == "OESO.DBF":
        return target_table, {
            **common,
            "document_no": get_first(raw_record, "SONUM", "DOCNO", "DOC_NO"),
            "customer_code": get_first(raw_record, "CUSCOD", "CUSTOMER_CODE"),
            "document_date": get_first(raw_record, "SODAT", "DOCDAT", "DOC_DATE"),
            "delivery_date": get_first(raw_record, "DLVDAT", "DELIVERY_DATE"),
            "status": get_first(raw_record, "STATUS", "DOCSTAT", default="synced"),
            "source_updated_at": get_first(raw_record, "UPDDAT", "UPDATED_AT"),
        }

    if table_name == "OESOIT.DBF":
        return target_table, {
            **common,
            "document_no": get_first(raw_record, "SONUM", "DOCNO", "DOC_NO"),
            "line_no": int(to_number(get_first(raw_record, "SEQNUM", "LINE_NO"), default=0)),
            "product_code": get_first(raw_record, "STKCOD", "PRODUCT_CODE"),
            "qty": to_number(get_first(raw_record, "ORDQTY", "QTY")),
            "uom": get_first(raw_record, "TQUCOD", "UOM"),
            "status": get_first(raw_record, "STATUS", default="synced"),
        }

    if table_name == "ARTRN.DBF":
        return target_table, {
            **common,
            "document_no": get_first(raw_record, "DOCNUM", "DOCNO", "INVNO"),
            "customer_code": get_first(raw_record, "CUSCOD", "CUSTOMER_CODE"),
            "invoice_date": get_first(raw_record, "DOCDAT", "INVDAT", "DOC_DATE"),
            "status": get_first(raw_record, "STATUS", default="synced"),
        }

    if table_name == "STTRN.DBF":
        return target_table, {
            **common,
            "document_no": get_first(raw_record, "DOCNUM", "DOCNO"),
            "from_warehouse_code": get_first(raw_record, "FRLOCCOD", "FROM_LOC", "FROM_WAREHOUSE"),
            "to_warehouse_code": get_first(raw_record, "TOLOCCOD", "TO_LOC", "TO_WAREHOUSE"),
            "transfer_date": get_first(raw_record, "DOCDAT", "TRANSFER_DATE"),
            "status": get_first(raw_record, "STATUS", default="synced"),
        }

    raise ValueError(f"Unsupported table mapping: {table_name}")


def validate_payload(target_table, payload):
    required_keys = {
        "sc_express_products": ["room_code", "product_code"],
        "sc_express_stock": ["room_code", "product_code"],
        "sc_express_customers": ["room_code", "customer_code"],
        "sc_express_so_headers": ["room_code", "document_no"],
        "sc_express_so_lines": ["room_code", "document_no", "product_code"],
        "sc_express_invoices": ["room_code", "document_no"],
        "sc_express_transfers": ["room_code", "document_no"],
    }

    missing = [key for key in required_keys.get(target_table, []) if not payload.get(key)]

    if missing:
        raise ValueError(f"Missing required mapped fields for {target_table}: {', '.join(missing)}")


def memo_file_exists(dbf_path):
    path = Path(dbf_path)
    memo_paths = [
        path.with_suffix(".FPT"),
        path.with_suffix(".fpt"),
        path.with_suffix(".DBT"),
        path.with_suffix(".dbt"),
    ]
    return any(memo_path.exists() for memo_path in memo_paths)


def matching_sidecar_path(source_path, suffix):
    candidates = [
        source_path.with_suffix(suffix.upper()),
        source_path.with_suffix(suffix.lower()),
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return None


def cache_safe_name(value):
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", str(value))


def is_supabase_space_error(exc):
    current = exc
    while current:
        code = getattr(current, "code", None)
        message = str(current)
        if code == "53100" or "53100" in message or "could not extend file" in message.lower() or "no space left" in message.lower():
            return True
        current = getattr(current, "__cause__", None)
    return False


def is_oesoit_empty_ghost_row(raw_record):
    document_no = get_first(raw_record, "SONUM", "DOCNO", "DOC_NO")
    product_code = get_first(raw_record, "STKCOD", "PRODUCT_CODE")
    return not document_no and not product_code


def is_blank_like(value):
    return value is None or (isinstance(value, str) and value.strip() == "")


def normalize_stock_payload(payload):
    normalized_count = 0

    for key in ["warehouse_code", "location_code", "lot_no"]:
        if is_blank_like(payload.get(key)):
            if payload.get(key) != "":
                normalized_count += 1
            payload[key] = ""

    return normalized_count


def normalize_payload_for_target(target_table, payload):
    if target_table == "sc_express_stock":
        return normalize_stock_payload(payload)

    return 0


class ExpressSync:
    def __init__(self):
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for sync.")

        self.supabase = create_client(url, key)
        self.last_cache_path = None
        self.copied_cache_files = set()

    def create_job(self, room_code, source_table, status="running"):
        result = self.supabase.table("sync_jobs").insert({
            "room_code": room_code,
            "job_name": f"express_sync:{room_code}:{source_table}",
            "source_table": source_table,
            "status": status,
            "started_at": datetime.utcnow().isoformat(),
        }).execute()
        return result.data[0]

    def finish_job(self, job_id, status, last_error=None):
        self.supabase.table("sync_jobs").update({
            "status": status,
            "finished_at": datetime.utcnow().isoformat(),
            "last_error": last_error,
        }).eq("id", job_id).execute()

    def log(self, sync_job_id, room_code, source_table, level, message, detail=None, status=None):
        self.supabase.table("sync_logs").insert({
            "sync_job_id": sync_job_id,
            "room_code": room_code,
            "source_table": source_table,
            "level": level,
            "message": message,
            "detail": detail,
            "status": status,
        }).execute()

    def create_batch(self, sync_job_id, room_code, source_table, batch_no):
        result = self.supabase.table("sync_batches").insert({
            "sync_job_id": sync_job_id,
            "room_code": room_code,
            "source_table": source_table,
            "batch_no": batch_no,
            "status": "running",
        }).execute()
        return result.data[0]

    def finish_batch(self, batch_id, records_read, records_success, records_failed, status):
        self.supabase.table("sync_batches").update({
            "records_read": records_read,
            "records_success": records_success,
            "records_failed": records_failed,
            "status": status,
        }).eq("id", batch_id).execute()

    def record_failed(self, sync_job_id, room_code, source_table, record_key, error_message, raw_data):
        self.record_failed_to_cache(room_code, source_table, record_key, error_message, raw_data)

        if sync_job_id is None:
            return

        self.supabase.table("sync_failed_records").insert({
            "sync_job_id": sync_job_id,
            "room_code": room_code,
            "source_table": source_table,
            "record_key": record_key,
            "error_message": error_message,
            "raw_data": raw_data,
            "status": "failed",
        }).execute()

    def record_failed_to_cache(self, room_code, source_table, record_key, error_message, raw_data):
        try:
            cache_dir = config.FAILED_RECORDS_CACHE_PATH / cache_safe_name(room_code)
            cache_dir.mkdir(parents=True, exist_ok=True)
            file_name = f"{cache_safe_name(source_table)}-{datetime.utcnow().strftime('%Y%m%d')}.jsonl"
            cache_path = cache_dir / file_name
            payload = {
                "failed_at": datetime.utcnow().isoformat(),
                "room_code": room_code,
                "source_table": source_table,
                "record_key": record_key,
                "error_message": error_message,
                "raw_data": raw_data,
            }

            with cache_path.open("a", encoding="utf-8") as cache_file:
                cache_file.write(json.dumps(payload, ensure_ascii=False, default=str))
                cache_file.write("\n")
        except Exception as exc:
            safe_print(f"[WARN] Failed to write local failed record cache: {exc}")

    def upsert_payload(self, target_table, payload):
        return self.upsert_payloads(target_table, [payload])

    def upsert_payloads(self, target_table, payloads):
        if not payloads:
            return None

        for payload in payloads:
            normalize_payload_for_target(target_table, payload)

        conflict_keys = config.UPSERT_CONFLICT_KEYS.get(target_table)

        if conflict_keys:
            return self.supabase.table(target_table).upsert(
                payloads,
                on_conflict=conflict_keys,
            ).execute()

        return self.supabase.table(target_table).upsert(payloads).execute()

    def cleanup_dbf_temp_cache(self):
        cache_root = config.DBF_TEMP_CACHE_PATH
        deleted_files = 0

        try:
            cache_root.mkdir(parents=True, exist_ok=True)
            for path in list(self.copied_cache_files):
                if path.exists() and path.is_file() and path.suffix.lower() in {".dbf", ".cdx", ".fpt", ".dbt"}:
                    path.unlink()
                    deleted_files += 1

            for path in sorted(cache_root.rglob("*"), reverse=True):
                if path.is_dir():
                    try:
                        path.rmdir()
                    except OSError:
                        pass

            safe_print(f"[CLEANUP] Removed {deleted_files} temp DBF cache files from {cache_root}")
        except Exception as exc:
            safe_print(f"[WARN] Temp DBF cache cleanup failed: {exc}")

        return deleted_files

    def copy_dbf_to_local_cache(self, room_code, table_name, source_path, sync_job_id=None):
        cache_dir = config.DBF_TEMP_CACHE_PATH / room_code
        cache_dir.mkdir(parents=True, exist_ok=True)

        source_path = Path(source_path)
        local_dbf_path = cache_dir / source_path.name

        try:
            for suffix in [".DBF", ".CDX", ".FPT", ".DBT"]:
                local_path = cache_dir / f"{source_path.stem}{suffix}"
                if local_path.exists():
                    local_path.unlink()

                matching_source = source_path if suffix == ".DBF" else matching_sidecar_path(source_path, suffix)

                if matching_source and matching_source.exists():
                    safe_print(f"[COPY] {matching_source} -> {local_path}")
                    shutil.copy2(matching_source, local_path)
                    self.copied_cache_files.add(local_path)

            return local_dbf_path
        except Exception as exc:
            message = f"Failed to copy DBF files to local cache: {exc}"
            if sync_job_id:
                self.log(
                    sync_job_id,
                    room_code,
                    table_name,
                    "error",
                    message,
                    detail={
                        "source_path": str(source_path),
                        "cache_dir": str(cache_dir),
                    },
                    status="failed",
                )
            safe_print(f"[FAILED] {message}")
            raise

    def read_dbf_records(self, room_code, table_name, sync_job_id=None):
        path = config.get_dbf_path(room_code, table_name)

        if not Path(path).exists():
            raise FileNotFoundError(f"DBF file not found: {path}")

        local_path = self.copy_dbf_to_local_cache(room_code, table_name, path, sync_job_id=sync_job_id)
        self.last_cache_path = local_path
        safe_print(f"[READ_LOCAL] {local_path}")

        if not memo_file_exists(local_path):
            message = "Memo file not found; reading DBF with ignore_missing_memofile=True"
            if sync_job_id:
                self.log(
                    sync_job_id,
                    room_code,
                    table_name,
                    "warning",
                    message,
                    detail={"dbf_path": str(path), "local_path": str(local_path)},
                    status="running",
                )
            else:
                safe_print(f"[WARN] {message}: {local_path}")

        try:
            table = DBF(
                local_path,
                encoding=config.PRIMARY_ENCODING,
                char_decode_errors="ignore",
                ignore_missing_memofile=True,
                parserclass=SafeFieldParser,
            )
            for record in table:
                yield clean_record(record)
        except UnicodeDecodeError:
            table = DBF(
                local_path,
                encoding=config.FALLBACK_ENCODING,
                char_decode_errors="ignore",
                ignore_missing_memofile=True,
                parserclass=SafeFieldParser,
            )
            for record in table:
                yield clean_record(record)

    def table_requires_window_or_limit(self, table_name, policy_group, options):
        if options.get("full"):
            return False
        if options.get("limit"):
            return False
        if options.get("since_date"):
            return False
        if policy_group in {"master_full", "stock_current_full", "active_order_full", "sales_invoice_detail_1y"}:
            return False
        return table_name in config.LARGE_TRANSACTION_TABLES

    def apply_policy(self, raw_record, table_name, policy_group, date_window, options):
        if options.get("full"):
            return True, "full"

        if policy_group in {"master_full", "stock_current_full"}:
            return True, policy_group

        if policy_group == "active_order_full":
            if is_active_order_record(raw_record):
                return True, "active_order"
            if date_window:
                record_date, field_name = get_record_policy_date(raw_record, policy_group)
                if record_date and record_date >= date_window:
                    return True, f"date_window:{field_name}"
            return False, "closed_or_historical_order"

        if policy_group == "sales_invoice_detail_1y":
            record_date, field_name = get_record_policy_date(raw_record, policy_group)
            if not field_name:
                if options.get("limit"):
                    return True, "limit_override_missing_date"
                return False, "policy_date_missing"
            if record_date and date_window and record_date >= date_window:
                return True, f"date_window:{field_name}"
            return False, "outside_date_window"

        if policy_group == "sales_monthly_summary_3y":
            return False, "monthly_summary_not_implemented"

        if policy_group == "blocked_full_history_by_default":
            if options.get("limit"):
                return True, "limit_override"
            if date_window:
                record_date, field_name = get_record_policy_date(raw_record, policy_group)
                if not field_name:
                    return False, "policy_date_missing"
                return record_date and record_date >= date_window, f"date_window:{field_name}"
            return False, "blocked_full_history"

        return False, "unknown_policy"

    def sync_table(self, room_code, table_name, options=None):
        options = options or {}
        table_started_at = time.perf_counter()
        table_name = table_name.upper()
        dbf_path = config.get_dbf_path(room_code, table_name)
        policy_group = get_policy_group(table_name)
        date_window = get_policy_date_window(policy_group, options.get("since_date"))
        dry_run = bool(options.get("dry_run"))
        limit = options.get("limit")
        limited = False
        invalid_date_table_key = table_name
        invalid_date_start_count = INVALID_DATE_COUNTS.get(invalid_date_table_key, 0)
        safe_print(f"[START] Sync room {room_code} table {table_name}")
        safe_print(f"[READ] {table_name}")
        safe_print(f"[PATH] {dbf_path}")
        safe_print(f"[POLICY] table={table_name} policy_group={policy_group} since_date={date_window}")

        summary = {
            "room": room_code,
            "table": table_name,
            "policy_group": policy_group,
            "total_rows_read": 0,
            "selected_rows": 0,
            "skipped_by_policy": 0,
            "skipped_empty_rows": 0,
            "normalized_null_key_fields": 0,
            "upserted_rows": 0,
            "inserted_fallback_rows": 0,
            "failed_rows": 0,
            "invalid_date_count": 0,
            "dry_run": dry_run,
            "limited": False,
            "limit": limit,
            "since_date": date_window.isoformat() if date_window else None,
            "cache_path": None,
            "failed_records_path": str(config.FAILED_RECORDS_CACHE_PATH / cache_safe_name(room_code)),
            "elapsed_time": 0,
            "status": "running",
        }

        if self.table_requires_window_or_limit(table_name, policy_group, options):
            safe_print(
                f"[BLOCKED_TABLE_POLICY] {table_name} policy_group={policy_group} requires --limit, --since-date, or --full"
            )
            summary["status"] = "blocked_by_policy"
            summary["elapsed_time"] = time.perf_counter() - table_started_at
            self.print_table_summary(summary)
            return summary

        if policy_group in {"sales_invoice_detail_1y", "blocked_full_history_by_default"} and not get_policy_config(policy_group).get("date_fields") and not (limit or options.get("full")):
            safe_print(f"[POLICY_DATE_FIELD_MISSING] {table_name} has no configured date field")
            summary["status"] = "blocked_missing_date_field"
            summary["elapsed_time"] = time.perf_counter() - table_started_at
            self.print_table_summary(summary)
            return summary

        job_id = None
        if not dry_run:
            job = self.create_job(room_code, table_name)
            job_id = job["id"]

        total_read = 0
        total_failed = 0
        upsert_tables_started = set()
        inserted_fallback_rows = 0
        current_fallback_warned = set()

        try:
            if not dry_run:
                self.log(job_id, room_code, table_name, "info", "Starting DBF sync", status="running")
            batch_no = 1
            batch_id = None
            batch_read = 0
            batch_success = 0
            batch_failed = 0
            batch_target_table = None
            batch_payloads = []

            def flush_batch():
                nonlocal batch_no
                nonlocal batch_id
                nonlocal batch_read
                nonlocal batch_success
                nonlocal batch_failed
                nonlocal batch_target_table
                nonlocal batch_payloads
                nonlocal total_failed
                nonlocal inserted_fallback_rows

                if dry_run or batch_id is None:
                    batch_payloads = []
                    return

                if batch_payloads:
                    try:
                        if batch_target_table not in config.UPSERT_CONFLICT_KEYS:
                            inserted_fallback_rows += len(batch_payloads)
                            if batch_target_table not in current_fallback_warned:
                                safe_print(f"[WARN_INSERT_FALLBACK] {batch_target_table} has no configured conflict key")
                                current_fallback_warned.add(batch_target_table)
                        self.upsert_payloads(batch_target_table, batch_payloads)
                        summary["upserted_rows"] += len(batch_payloads)
                        batch_success += len(batch_payloads)
                    except Exception as exc:
                        if is_supabase_space_error(exc):
                            safe_print("[FATAL_SUPABASE_SPACE] Supabase/Postgres returned code 53100 or disk space error.")
                            raise FatalSupabaseSpaceError(str(exc)) from exc
                        failed_count = len(batch_payloads)
                        total_failed += failed_count
                        batch_failed += failed_count
                        self.log(
                            job_id,
                            room_code,
                            table_name,
                            "error",
                            f"Bulk upsert failed for {batch_target_table}",
                            detail={
                                "error": str(exc),
                                "batch_no": batch_no,
                                "records_in_chunk": failed_count,
                            },
                            status="failed",
                        )
                        raise

                self.finish_batch(
                    batch_id,
                    batch_read,
                    batch_success,
                    batch_failed,
                    "completed" if batch_failed == 0 else "completed_with_errors",
                )

                batch_no += 1
                batch_id = None
                batch_read = 0
                batch_success = 0
                batch_failed = 0
                batch_target_table = None
                batch_payloads = []

            for raw_record in self.read_dbf_records(room_code, table_name, sync_job_id=job_id):
                summary["cache_path"] = str(self.last_cache_path) if self.last_cache_path else None

                if not dry_run and batch_id is None:
                    batch = self.create_batch(job_id, room_code, table_name, batch_no)
                    batch_id = batch["id"]

                total_read += 1
                summary["total_rows_read"] = total_read
                batch_read += 1

                if table_name == "OESOIT.DBF" and is_oesoit_empty_ghost_row(raw_record):
                    summary["skipped_empty_rows"] += 1
                    if total_read % 1000 == 0:
                        safe_print(f"[COUNT] {total_read} rows processed")
                    continue

                selected, policy_reason = self.apply_policy(raw_record, table_name, policy_group, date_window, options)
                if not selected:
                    summary["skipped_by_policy"] += 1
                    if policy_reason == "policy_date_missing":
                        safe_print(f"[POLICY_DATE_FIELD_MISSING] {table_name} row={total_read}")
                    if total_read % 1000 == 0:
                        safe_print(f"[COUNT] {total_read} rows processed")
                    continue

                try:
                    target_table, payload = map_record(room_code, table_name, raw_record)
                    summary["normalized_null_key_fields"] += normalize_payload_for_target(target_table, payload)
                    validate_payload(target_table, payload)
                    summary["selected_rows"] += 1
                    if target_table not in upsert_tables_started:
                        if dry_run:
                            safe_print(f"[UPSERT] {target_table} dry-run validation started")
                        else:
                            safe_print(f"[UPSERT] {target_table} started")
                        upsert_tables_started.add(target_table)
                    if not dry_run and batch_target_table and batch_target_table != target_table:
                        flush_batch()
                        batch = self.create_batch(job_id, room_code, table_name, batch_no)
                        batch_id = batch["id"]
                        batch_read = 0
                    if not dry_run:
                        batch_target_table = target_table
                        batch_payloads.append(payload)
                except Exception as exc:
                    total_failed += 1
                    batch_failed += 1
                    summary["failed_rows"] += 1
                    record_key = json.dumps({
                        "room_code": room_code,
                        "source_table": table_name,
                        "row": total_read,
                    })
                    self.record_failed(
                        job_id,
                        room_code,
                        table_name,
                        record_key,
                        str(exc),
                        {"raw_record": raw_record},
                    )

                if total_read % 1000 == 0:
                    safe_print(f"[COUNT] {total_read} rows processed")

                if limit and summary["selected_rows"] >= limit:
                    limited = True
                    summary["limited"] = True
                    safe_print(f"[LIMIT] {table_name} selected row limit reached: {limit}")
                    break

                if batch_read >= config.SYNC_BATCH_SIZE:
                    flush_batch()

            if not dry_run and batch_id is not None:
                flush_batch()

            final_status = "completed" if total_failed == 0 else "completed_with_errors"
            invalid_date_count = INVALID_DATE_COUNTS.get(invalid_date_table_key, 0) - invalid_date_start_count
            for target_table in sorted(upsert_tables_started):
                safe_print(f"[UPSERT] {target_table} {'dry-run completed' if dry_run else 'completed'}")

            summary["invalid_date_count"] = invalid_date_count
            summary["inserted_fallback_rows"] = inserted_fallback_rows
            summary["failed_rows"] = total_failed
            summary["status"] = final_status

            if not dry_run:
                self.log(
                    job_id,
                    room_code,
                    table_name,
                    "info",
                    "Finished DBF sync",
                    detail=summary,
                    status=final_status,
                )
                self.finish_job(job_id, final_status)
                if final_status in ("completed", "completed_with_errors"):
                    import sync_state
                    if options.get("historical_mode"):
                        sync_state.mark_historical_table(room_code, table_name)
                    if (
                        options.get("active_mode")
                        and options.get("full")
                        and table_name.upper() in sync_state.TRANSACTION_TABLES
                    ):
                        sync_state.mark_active_initial_full(room_code)
            elapsed = time.perf_counter() - table_started_at
            summary["elapsed_time"] = elapsed
            safe_print(f"[DONE] {table_name} completed in {elapsed:.1f}s")
            self.print_table_summary(summary)
            return summary
        except FatalSupabaseSpaceError as exc:
            elapsed = time.perf_counter() - table_started_at
            invalid_date_count = INVALID_DATE_COUNTS.get(invalid_date_table_key, 0) - invalid_date_start_count
            summary["elapsed_time"] = elapsed
            summary["invalid_date_count"] = invalid_date_count
            summary["failed_rows"] = total_failed
            summary["inserted_fallback_rows"] = inserted_fallback_rows
            summary["status"] = "fatal_supabase_space"
            summary["error"] = str(exc)
            safe_print(f"[FATAL_SUPABASE_SPACE] {table_name} stopped in {elapsed:.1f}s: {exc}")
            if job_id:
                self.log(job_id, room_code, table_name, "error", str(exc), detail=summary, status="failed")
                self.finish_job(job_id, "failed", last_error=str(exc))
            self.print_table_summary(summary)
            return summary
        except Exception as exc:
            elapsed = time.perf_counter() - table_started_at
            invalid_date_count = INVALID_DATE_COUNTS.get(invalid_date_table_key, 0) - invalid_date_start_count
            safe_print(f"[FAILED] {table_name} failed in {elapsed:.1f}s: {exc}")
            summary["elapsed_time"] = elapsed
            summary["invalid_date_count"] = invalid_date_count
            summary["failed_rows"] = total_failed
            summary["inserted_fallback_rows"] = inserted_fallback_rows
            summary["status"] = "failed"
            summary["error"] = str(exc)
            if job_id:
                error_detail = traceback.format_exc()
                self.log(job_id, room_code, table_name, "error", str(exc), detail={"traceback": error_detail}, status="failed")
                self.finish_job(job_id, "failed", last_error=str(exc))
            self.print_table_summary(summary)
            return summary

    def retry_failed_records(self, limit=100):
        result = self.supabase.table("sync_failed_records").select("*").eq("status", "failed").limit(limit).execute()
        records = result.data or []

        for failed_record in records:
            retry_count = failed_record.get("retry_count", 0) or 0

            if retry_count >= 3:
                self.supabase.table("sync_failed_records").update({
                    "status": "dead_letter",
                    "error_message": "Retry limit reached; record moved to dead_letter.",
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", failed_record["id"]).execute()
                safe_print(f"[RETRY_SKIP] {failed_record['id']} reached retry limit")
                continue

            raw_data = failed_record.get("raw_data") or {}
            raw_record = raw_data.get("raw_record")
            room_code = failed_record["room_code"]
            source_table = failed_record["source_table"]

            try:
                target_table, payload = map_record(room_code, source_table, raw_record)
                validate_payload(target_table, payload)
                self.upsert_payload(target_table, payload)
                self.supabase.table("sync_failed_records").update({
                    "status": "retried",
                    "retry_count": retry_count + 1,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", failed_record["id"]).execute()
            except Exception as exc:
                self.supabase.table("sync_failed_records").update({
                    "error_message": str(exc),
                    "retry_count": retry_count + 1,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", failed_record["id"]).execute()

    def print_table_summary(self, summary):
        safe_print(
            "[TABLE_SUMMARY] "
            f"room={summary.get('room')} table={summary.get('table')} "
            f"policy_group={summary.get('policy_group')} "
            f"total_rows_read={summary.get('total_rows_read')} "
            f"selected_rows={summary.get('selected_rows')} "
            f"skipped_by_policy={summary.get('skipped_by_policy')} "
            f"skipped_empty_rows={summary.get('skipped_empty_rows')} "
            f"normalized_null_key_fields={summary.get('normalized_null_key_fields')} "
            f"upserted_rows={summary.get('upserted_rows')} "
            f"inserted_fallback_rows={summary.get('inserted_fallback_rows')} "
            f"failed_rows={summary.get('failed_rows')} "
            f"invalid_date_count={summary.get('invalid_date_count')} "
            f"dry_run={summary.get('dry_run')} "
            f"limited={summary.get('limited')} "
            f"limit={summary.get('limit')} "
            f"since_date={summary.get('since_date')} "
            f"cache_path={summary.get('cache_path')} "
            f"failed_records_path={summary.get('failed_records_path')} "
            f"elapsed_time={summary.get('elapsed_time'):.1f}s "
            f"status={summary.get('status')}"
        )

    def sync_rooms(self, rooms, tables, options=None):
        options = options or {}
        sync_started_at = time.perf_counter()
        summary = {
            "rooms_processed": 0,
            "tables_processed": 0,
            "successful_tables": 0,
            "failed_tables": 0,
            "blocked_tables": 0,
            "records_processed": 0,
            "failed_records": 0,
            "selected_rows": 0,
            "skipped_by_policy": 0,
            "skipped_empty_rows": 0,
            "normalized_null_key_fields": 0,
            "upserted_rows": 0,
            "inserted_fallback_rows": 0,
            "invalid_date_count": 0,
            "dry_run": bool(options.get("dry_run")),
            "table_summaries": [],
            "fatal_supabase_space": False,
        }

        for room_code in rooms:
            room_code = config.normalize_room_code(room_code)
            room_started_at = time.perf_counter()
            safe_print(f"[START] Sync room {room_code}")
            room_had_attempt = False

            for table_name in tables:
                room_had_attempt = True

                try:
                    table_result = self.sync_table(room_code, table_name, options=options)
                except Exception as exc:
                    safe_print(f"[FAILED] room={room_code} table={table_name} failed unexpectedly: {exc}")
                    table_result = {
                        "status": "failed",
                        "total_rows_read": 0,
                        "failed_rows": 0,
                        "selected_rows": 0,
                        "skipped_by_policy": 0,
                        "skipped_empty_rows": 0,
                        "normalized_null_key_fields": 0,
                        "upserted_rows": 0,
                        "inserted_fallback_rows": 0,
                        "invalid_date_count": 0,
                    }

                summary["tables_processed"] += 1
                summary["records_processed"] += table_result.get("total_rows_read", 0)
                summary["failed_records"] += table_result.get("failed_rows", 0)
                summary["selected_rows"] += table_result.get("selected_rows", 0)
                summary["skipped_by_policy"] += table_result.get("skipped_by_policy", 0)
                summary["skipped_empty_rows"] += table_result.get("skipped_empty_rows", 0)
                summary["normalized_null_key_fields"] += table_result.get("normalized_null_key_fields", 0)
                summary["upserted_rows"] += table_result.get("upserted_rows", 0)
                summary["inserted_fallback_rows"] += table_result.get("inserted_fallback_rows", 0)
                summary["invalid_date_count"] += table_result.get("invalid_date_count", 0)
                summary["table_summaries"].append(table_result)

                if table_result.get("status") == "failed":
                    summary["failed_tables"] += 1
                elif table_result.get("status") == "fatal_supabase_space":
                    summary["failed_tables"] += 1
                    summary["fatal_supabase_space"] = True
                    safe_print("[FATAL_SUPABASE_SPACE] Stopping remaining rooms/tables. Check Supabase database size.")
                    break
                elif str(table_result.get("status", "")).startswith("blocked"):
                    summary["blocked_tables"] += 1
                else:
                    summary["successful_tables"] += 1

            if summary["fatal_supabase_space"]:
                break

            if room_had_attempt:
                summary["rooms_processed"] += 1

            elapsed = time.perf_counter() - room_started_at
            safe_print(f"[DONE] Room {room_code} completed in {elapsed:.1f}s")

        summary["elapsed"] = time.perf_counter() - sync_started_at
        self.cleanup_dbf_temp_cache()
        self.print_sync_summary(summary)
        return summary

    def print_sync_summary(self, summary):
        safe_print("[FINAL_SUMMARY] Express DBF sync finished")
        safe_print(f"[FINAL_SUMMARY] total rooms processed: {summary['rooms_processed']}")
        safe_print(f"[FINAL_SUMMARY] total tables processed: {summary['tables_processed']}")
        safe_print(f"[FINAL_SUMMARY] successful tables: {summary['successful_tables']}")
        safe_print(f"[FINAL_SUMMARY] failed tables: {summary['failed_tables']}")
        safe_print(f"[FINAL_SUMMARY] blocked tables: {summary['blocked_tables']}")
        safe_print(f"[FINAL_SUMMARY] total records processed: {summary['records_processed']}")
        safe_print(f"[FINAL_SUMMARY] selected rows: {summary['selected_rows']}")
        safe_print(f"[FINAL_SUMMARY] skipped by policy: {summary['skipped_by_policy']}")
        safe_print(f"[FINAL_SUMMARY] skipped empty rows: {summary['skipped_empty_rows']}")
        safe_print(f"[FINAL_SUMMARY] normalized null key fields: {summary['normalized_null_key_fields']}")
        safe_print(f"[FINAL_SUMMARY] upserted rows: {summary['upserted_rows']}")
        safe_print(f"[FINAL_SUMMARY] inserted fallback rows: {summary['inserted_fallback_rows']}")
        safe_print(f"[FINAL_SUMMARY] total failed records: {summary['failed_records']}")
        safe_print(f"[FINAL_SUMMARY] invalid date fields: {summary['invalid_date_count']}")
        safe_print(f"[FINAL_SUMMARY] dry_run={summary.get('dry_run')}")
        safe_print(f"[FINAL_SUMMARY] fatal_supabase_space={summary.get('fatal_supabase_space')}")
        safe_print(f"[FINAL_SUMMARY] elapsed time: {summary['elapsed']:.1f}s")


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Sync Express ERP DBF data into Supabase raw tables.")
    parser.add_argument("--room", action="append", dest="rooms", help="Room code to sync. Can be passed multiple times.")
    parser.add_argument("--table", action="append", dest="tables", help="DBF table to sync. Can be passed multiple times.")
    parser.add_argument("--limit", type=int, help="Maximum selected records per table after policy filtering.")
    parser.add_argument("--dry-run", action="store_true", help="Read, parse, filter, and validate without writing to Supabase.")
    parser.add_argument("--full", action="store_true", help="Explicitly allow full sync for selected tables.")
    parser.add_argument("--since-date", help="Override policy date window. Format: YYYY-MM-DD.")
    parser.add_argument("--policy", default="default", help="Policy profile to use. Currently only: default.")
    parser.add_argument("--archive", action="store_true", help="Sync archive/historical rooms instead of active rooms.")
    parser.add_argument("--active-rooms", action="store_true", help="Sync all active rooms (TSS, TSS-NV, CONSI).")
    parser.add_argument("--historical-rooms", action="store_true", help="Sync historical one-time rooms.")
    parser.add_argument("--months", type=int, help="Rolling window in months for transaction tables.")
    parser.add_argument("--force", action="store_true", help="Force historical re-sync even if already completed.")
    parser.add_argument("--retry-failed", action="store_true", help="Retry failed records instead of reading DBF files.")
    parser.add_argument("--retry-limit", type=int, default=100, help="Maximum failed records to retry.")
    return parser.parse_args(argv)


def print_blocked_full_sync_warning():
    safe_print("[BLOCKED_FULL_SYNC] Running all rooms/all tables without --full is blocked to protect Supabase storage.")
    safe_print("[BLOCKED_FULL_SYNC] Default policy v1:")
    safe_print("[BLOCKED_FULL_SYNC] - master data: full")
    safe_print("[BLOCKED_FULL_SYNC] - stock current: full")
    safe_print("[BLOCKED_FULL_SYNC] - active orders: full/open only")
    safe_print("[BLOCKED_FULL_SYNC] - sales/invoice detail: latest 1 year")
    safe_print("[BLOCKED_FULL_SYNC] - sales monthly summary: latest 3 years recommendation only")
    safe_print("[BLOCKED_FULL_SYNC] Examples:")
    safe_print("[BLOCKED_FULL_SYNC] .\\run_sync.bat --room TSS --table STMAS.DBF")
    safe_print("[BLOCKED_FULL_SYNC] .\\run_sync.bat --room TSS --table OESOIT.DBF --dry-run --limit 1000")
    safe_print("[BLOCKED_FULL_SYNC] .\\run_sync.bat --room TSS --table ARTRN.DBF --since-date 2025-05-26")
    safe_print("[BLOCKED_FULL_SYNC] Intentional full sync requires --full.")


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    sync = ExpressSync()

    if args.retry_failed:
        sync.retry_failed_records(limit=args.retry_limit)
        return 0

    if args.policy != "default":
        raise ValueError(f"Unknown sync policy profile: {args.policy}")

    if args.limit is not None and args.limit <= 0:
        raise ValueError("--limit must be greater than 0")

    if args.months is not None and args.months <= 0:
        raise ValueError("--months must be greater than 0")

    since_date = parse_cli_date(args.since_date)
    if args.months and not since_date:
        since_date = date.today() - timedelta(days=args.months * 30)

    import sync_state

    options = {
        "limit": args.limit,
        "dry_run": args.dry_run,
        "full": args.full,
        "since_date": since_date,
        "policy": args.policy,
        "months": args.months,
    }

    if args.historical_rooms or args.archive:
        allowed_rooms = config.HISTORICAL_ROOMS
        options["historical_mode"] = True
        if args.historical_rooms or args.full:
            options["full"] = True
        rooms = []
        for room_code in config.HISTORICAL_ROOMS:
            if sync_state.should_skip_historical_room(room_code, force=args.force):
                safe_print(f"[SKIP_HISTORICAL] Room {room_code} already synced. Use --force to re-sync.")
                continue
            rooms.append(room_code)
        if not rooms and (args.historical_rooms or args.archive):
            safe_print("[SKIP_HISTORICAL] All historical rooms already synced.")
            return 0
    elif args.active_rooms:
        allowed_rooms = config.ACTIVE_ROOMS
        options["active_mode"] = True
        rooms = list(config.ACTIVE_ROOMS)
        transaction_tables = sync_state.TRANSACTION_TABLES
        tables_requested = [t.upper() for t in (args.tables or [])]
        if tables_requested and not args.full and not args.months:
            if any(t in transaction_tables for t in tables_requested):
                if any(
                    sync_state.active_room_needs_full(room, table)
                    for room in rooms
                    for table in tables_requested
                    if table in transaction_tables
                ):
                    options["full"] = True
                    safe_print("[ACTIVE_POLICY] First full sync for transaction table(s) before rolling window.")
    else:
        allowed_rooms = config.HISTORICAL_ROOMS if args.archive else config.ACTIVE_ROOMS
        rooms = args.rooms or allowed_rooms

    if not args.rooms and not args.tables and not args.full and not args.active_rooms and not args.historical_rooms:
        print_blocked_full_sync_warning()
        return 2

    rooms = [config.normalize_room_code(r) for r in rooms]
    tables = [table.upper() for table in (args.tables or config.DBF_TABLES)]

    for room_code in rooms:
        if room_code not in allowed_rooms:
            raise ValueError(f"Room {room_code} is not allowed in this mode.")

    for table_name in tables:
        if table_name not in config.DBF_TABLES:
            raise ValueError(f"Unknown DBF table: {table_name}")

    sync.sync_rooms(
        rooms,
        tables,
        options=options,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
