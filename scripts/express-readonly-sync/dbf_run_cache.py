"""Unique per-run DBF temp cache paths (avoids WinError 32 file locks on Windows)."""
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from safe_dbf_parser import safe_print


def make_run_cache_root(base_path: Path) -> Path:
    """Create cache/dbf_temp/runs/<timestamp>_<pid>/ for this sync process."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
    run_root = base_path / "runs" / f"{timestamp}_{os.getpid()}"
    run_root.mkdir(parents=True, exist_ok=True)
    return run_root


def cleanup_run_cache(run_root: Path, copied_files=None) -> int:
    """
    Best-effort cleanup of this run's temp cache only.
    Locked files must not fail the sync or block the next run.
    """
    deleted_files = 0
    copied_files = copied_files or []

    for path in list(copied_files):
        try:
            if path.exists() and path.is_file():
                path.unlink()
                deleted_files += 1
        except OSError as exc:
            safe_print(f"[WARN] Could not delete temp cache file {path}: {exc}")

    if run_root and run_root.exists():
        try:
            shutil.rmtree(run_root)
            safe_print(f"[CLEANUP] Removed run temp cache {run_root} ({deleted_files} file(s))")
        except OSError as exc:
            safe_print(f"[WARN] Run temp cache cleanup failed for {run_root}: {exc}")
            safe_print("[WARN] Next sync will use a new run folder; locked files will not block future runs.")

    return deleted_files
