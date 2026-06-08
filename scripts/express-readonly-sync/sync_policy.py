"""Sync policy groups — adapted from tss-supply-chain-management/sync_scripts/config.py."""
from datetime import date, datetime, timedelta

SYNC_POLICY_GROUPS = {
    "master_full": {
        "description": "Small master data tables are allowed to sync in full.",
        "tables": ["STMAS.DBF", "ARMAS.DBF"],
    },
    "stock_current_full": {
        "description": "Current stock and balance style tables are allowed to sync in full.",
        "tables": ["STLOC.DBF"],
    },
    "active_order_full": {
        "description": "Active/open sales orders are allowed; historical closed orders require a date window or --full.",
        "tables": ["OESO.DBF"],
        "date_fields": ["sodat", "dldat", "dlvdat", "docdat"],
        "status_fields": ["status", "docstat"],
        "closed_statuses": ["C", "CLOSE", "CLOSED", "COMPLETE", "COMPLETED", "POSTED", "CANCEL", "CANCELLED"],
    },
    "sales_invoice_detail_1y": {
        "description": "Sales and invoice detail are limited to latest 1 year by default.",
        "tables": ["OESOIT.DBF", "ARTRN.DBF"],
        "date_fields": ["sodat", "docdat", "invdat", "trndat"],
    },
    "blocked_full_history_by_default": {
        "description": "Large transaction/history tables must not run unlimited unless explicitly approved with --full.",
        "tables": ["STTRN.DBF"],
        "date_fields": ["docdat", "trndat"],
    },
}

TABLE_SYNC_POLICIES = {
    table_name: policy_group
    for policy_group, policy in SYNC_POLICY_GROUPS.items()
    for table_name in policy.get("tables", [])
}


def subtract_years(value, years):
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def parse_cli_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_record_date(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        for fmt in ("%Y-%m-%d", "%Y%m%d"):
            try:
                return datetime.strptime(cleaned[:10] if fmt == "%Y-%m-%d" else cleaned[:8], fmt).date()
            except ValueError:
                pass
    return None


def get_policy_group(table_name):
    return TABLE_SYNC_POLICIES.get(table_name.upper(), "blocked_full_history_by_default")


def get_policy_config(policy_group):
    return SYNC_POLICY_GROUPS.get(policy_group, {})


def get_policy_date_window(policy_group, since_date=None):
    today = date.today()
    if since_date:
        return since_date
    if policy_group == "sales_invoice_detail_1y":
        return today - timedelta(days=365)
    return None


def get_record_policy_date(raw_record, policy_group):
    policy = get_policy_config(policy_group)
    for field_name in policy.get("date_fields", []):
        parsed_date = parse_record_date(raw_record.get(field_name))
        if parsed_date:
            return parsed_date, field_name
    return None, None


def is_active_order_record(raw_record):
    policy = get_policy_config("active_order_full")
    closed_statuses = set(policy.get("closed_statuses", []))
    status_values = []
    for field_name in policy.get("status_fields", []):
        value = raw_record.get(field_name)
        if value not in (None, ""):
            status_values.append(str(value).strip().upper())
    if not status_values:
        return True
    return not any(value in closed_statuses for value in status_values)
