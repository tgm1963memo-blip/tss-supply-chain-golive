#!/usr/bin/env python3
"""Structure tests for local mirror scripts (no network/DBF required)."""
from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]

REQUIRED_FILES = [
    "local_mirror_config.py",
    "local_mirror_db.py",
    "sync_express_to_local_mirror.py",
    "build_read_models_from_local.py",
    "push_read_models_to_supabase.py",
    "run_local_mirror_pipeline.py",
    "README.md",
]

GITIGNORE_MARKERS = [
    "scripts/local-mirror/data/",
    "scripts/local-mirror/logs/",
    "scripts/local-mirror/cache/",
    "*.duckdb",
    "*.sqlite",
]


def test_required_files_exist() -> None:
    missing = [name for name in REQUIRED_FILES if not (SCRIPT_DIR / name).exists()]
    assert not missing, f"Missing local mirror files: {missing}"


def test_readonly_mode_in_sync_script() -> None:
    source = (SCRIPT_DIR / "sync_express_to_local_mirror.py").read_text(encoding="utf-8")
    assert "READONLY_MODE" in source
    assert "write-back" not in source.lower() or "no express write-back" in source.lower()


def test_push_uses_service_role_not_anon() -> None:
    source = (SCRIPT_DIR / "push_read_models_to_supabase.py").read_text(encoding="utf-8")
    assert "SUPABASE_SERVICE_ROLE_KEY" in source
    assert "VITE_SUPABASE_ANON_KEY" not in source


def test_gitignore_excludes_local_data() -> None:
    gitignore = (PROJECT_ROOT / ".gitignore").read_text(encoding="utf-8")
    for marker in GITIGNORE_MARKERS:
        assert marker in gitignore, f".gitignore missing: {marker}"


def test_migration_013_exists() -> None:
    migration = PROJECT_ROOT / "supabase" / "migrations" / "013_compact_read_model_strategy.sql"
    assert migration.exists(), "Migration 013 missing"
    content = migration.read_text(encoding="utf-8")
    assert "sc_rm_product_master" in content
    assert "sc_rm_sync_health" in content


def main() -> int:
    tests = [
        test_required_files_exist,
        test_readonly_mode_in_sync_script,
        test_push_uses_service_role_not_anon,
        test_gitignore_excludes_local_data,
        test_migration_013_exists,
    ]
    failed = 0
    for test in tests:
        name = test.__name__
        try:
            test()
            print(f"PASS {name}")
        except AssertionError as exc:
            failed += 1
            print(f"FAIL {name}: {exc}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
