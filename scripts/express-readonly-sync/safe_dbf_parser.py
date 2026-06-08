"""Safe DBF field parsing — adapted from tss-supply-chain-management sync_express.py."""
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from dbfread import FieldParser

INVALID_DATE_COUNTS = {}


def safe_print(message):
    try:
        print(message, flush=True)
    except Exception:
        pass


def clean_text(value):
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    import re
    cleaned = value.replace("\x00", "").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned or None


def clean_record(record):
    cleaned = {}
    for key, value in dict(record).items():
        normalized_key = key.lower()
        if isinstance(value, str):
            cleaned[normalized_key] = clean_text(value)
        elif isinstance(value, (datetime, date)):
            cleaned[normalized_key] = value.isoformat()
        elif isinstance(value, Decimal):
            cleaned[normalized_key] = float(value)
        else:
            cleaned[normalized_key] = value
    return cleaned


def get_first(record, *keys, default=None):
    for key in keys:
        value = record.get(key.lower())
        if value not in (None, ""):
            return value
    return default


def to_number(value, default=0):
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


class SafeFieldParser(FieldParser):
    def parseD(self, field, data):
        try:
            return super().parseD(field, data)
        except ValueError:
            if data is None or data.strip(b" 0") == b"":
                return None
            table_name = Path(getattr(self.table, "filename", "")).name or "unknown_table"
            field_name = getattr(field, "name", "unknown_field")
            INVALID_DATE_COUNTS[table_name] = INVALID_DATE_COUNTS.get(table_name, 0) + 1
            safe_print(
                f"[WARN] Invalid DBF date converted to None "
                f"table={table_name} field={field_name} raw={data!r}"
            )
            return None
