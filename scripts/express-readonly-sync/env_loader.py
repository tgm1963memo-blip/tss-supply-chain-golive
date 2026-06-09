"""Load Express sync environment files in a consistent order (never prints secrets)."""
import os
from pathlib import Path

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]

ENV_FILE_ORDER = [
    SCRIPT_DIR / ".env",
    SCRIPT_DIR / ".env.local",
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / ".env.local",
]

_LOADED = False


def load_sync_environment():
    """Load env files; later files override earlier ones."""
    global _LOADED
    loaded_paths = []
    for path in ENV_FILE_ORDER:
        if path.exists():
            load_dotenv(path, override=True)
            loaded_paths.append(path)
    _LOADED = True
    return loaded_paths


def reload_table_mapping_config():
    """Refresh express_table_mapping module globals from os.environ."""
    import express_table_mapping as config

    if hasattr(config, "reload_from_env"):
        config.reload_from_env()


def ensure_sync_environment():
    """Load env files once and refresh mapping module."""
    if not _LOADED:
        load_sync_environment()
    reload_table_mapping_config()


def print_startup_diagnostics():
    """Print safe yes/no diagnostics only."""
    url_present = bool(os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL"))
    key_present = bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    express_path_present = bool(os.getenv("EXPRESS_DBF_PATH", "").strip())
    readonly = os.getenv("READONLY_MODE", "true").lower() in ("1", "true", "yes")

    print(f"SUPABASE_URL present: {'yes' if url_present else 'no'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY present: {'yes' if key_present else 'no'}")
    print(f"EXPRESS_DBF_PATH present: {'yes' if express_path_present else 'no'}")
    print(f"READONLY_MODE: {'true' if readonly else 'false'}")
