"""Local sync agent state — historical completion, active full baseline, agent run metadata."""
import json
from datetime import datetime
from pathlib import Path

import express_table_mapping as config

STATE_PATH = config.SCRIPT_DIR / "cache" / "sync_state.json"
HISTORICAL_TABLES = list(config.UAT_DBF_TABLES)
TRANSACTION_TABLES = {"OESO.DBF", "OESOIT.DBF", "ARTRN.DBF"}
MASTER_CURRENT_TABLES = {"STMAS.DBF", "ARMAS.DBF", "STLOC.DBF"}


def _default_state():
    return {
        "historical_rooms": {},
        "active_rooms": {},
        "agent_runs": {},
        "updated_at": None,
    }


def load_state():
    if not STATE_PATH.exists():
        return _default_state()
    try:
        with STATE_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        base = _default_state()
        base.update(data)
        return base
    except Exception:
        return _default_state()


def save_state(state):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = datetime.utcnow().isoformat() + "Z"
    with STATE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2, ensure_ascii=False)


def should_skip_historical_room(room_code, force=False):
    if force:
        return False
    state = load_state()
    entry = state.get("historical_rooms", {}).get(room_code, {})
    return bool(entry.get("completed"))


def mark_historical_table(room_code, table_name):
    state = load_state()
    rooms = state.setdefault("historical_rooms", {})
    entry = rooms.setdefault(room_code, {"tables": [], "completed": False, "completed_at": None})
    table = table_name.upper()
    if table not in entry["tables"]:
        entry["tables"].append(table)
    if set(entry["tables"]) >= set(HISTORICAL_TABLES):
        entry["completed"] = True
        entry["completed_at"] = datetime.utcnow().isoformat() + "Z"
    save_state(state)


def active_room_needs_full(room_code, table_name):
    if table_name.upper() not in TRANSACTION_TABLES:
        return False
    state = load_state()
    entry = state.get("active_rooms", {}).get(room_code, {})
    return not bool(entry.get("initial_full_completed"))


def mark_active_initial_full(room_code):
    state = load_state()
    rooms = state.setdefault("active_rooms", {})
    entry = rooms.setdefault(room_code, {})
    entry["initial_full_completed"] = True
    entry["initial_full_completed_at"] = datetime.utcnow().isoformat() + "Z"
    save_state(state)


def record_agent_run(name, status, detail=None):
    state = load_state()
    runs = state.setdefault("agent_runs", {})
    runs[name] = {
        "status": status,
        "detail": detail or "",
        "finished_at": datetime.utcnow().isoformat() + "Z",
    }
    save_state(state)


def get_agent_run(name):
    return load_state().get("agent_runs", {}).get(name)


def get_historical_status():
    state = load_state()
    result = {}
    for room in config.HISTORICAL_ROOMS:
        entry = state.get("historical_rooms", {}).get(room, {})
        result[room] = {
            "completed": bool(entry.get("completed")),
            "completed_at": entry.get("completed_at"),
            "tables": entry.get("tables", []),
        }
    return result


def get_active_status():
    state = load_state()
    result = {}
    for room in config.ACTIVE_ROOMS:
        entry = state.get("active_rooms", {}).get(room, {})
        result[room] = {
            "initial_full_completed": bool(entry.get("initial_full_completed")),
            "initial_full_completed_at": entry.get("initial_full_completed_at"),
        }
    return result
