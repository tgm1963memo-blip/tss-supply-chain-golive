#!/usr/bin/env python3
"""Tests for per-run DBF temp cache directories."""
import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from dbf_run_cache import cleanup_run_cache, make_run_cache_root

RUN_ID_PATTERN = re.compile(
    r"^\d{8}T\d{12,}_\d+_[0-9a-f]{8}$",
)


class DbfRunCacheTests(unittest.TestCase):
    def test_make_run_cache_root_uses_runs_timestamp_pid_uuid(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            run_root = make_run_cache_root(base)
            run_id = run_root.name
            self.assertIn("runs", run_root.parts)
            self.assertTrue(run_root.exists())
            self.assertEqual(run_root.parent.name, "runs")
            self.assertRegex(run_id, RUN_ID_PATTERN)
            self.assertIn(f"_{os.getpid()}_", run_id)

    def test_each_run_gets_unique_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            first = make_run_cache_root(base)
            second = make_run_cache_root(base)
            self.assertNotEqual(first, second)
            self.assertTrue(first.exists())
            self.assertTrue(second.exists())

    def test_cleanup_removes_run_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            run_root = make_run_cache_root(base)
            other = make_run_cache_root(base)
            sample = run_root / "TSS" / "ARTRN.DBF"
            sample.parent.mkdir(parents=True)
            sample.write_bytes(b"test")
            deleted = cleanup_run_cache(run_root, {sample})
            self.assertEqual(deleted, 1)
            self.assertFalse(run_root.exists())
            self.assertTrue(other.exists())

    def test_cleanup_locked_file_logs_warning_without_raising(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            run_root = make_run_cache_root(base)
            sample = run_root / "TSS" / "ARTRN.DBF"
            sample.parent.mkdir(parents=True)
            sample.write_bytes(b"test")

            with patch("dbf_run_cache.shutil.rmtree", side_effect=PermissionError("locked")):
                with patch("dbf_run_cache.safe_print") as mock_print:
                    deleted = cleanup_run_cache(run_root, {sample})
            self.assertEqual(deleted, 1)
            mock_print.assert_any_call(
                f"[WARN] Run temp cache cleanup failed for {run_root}: locked"
            )
            mock_print.assert_any_call(
                "[WARN] Next sync will use a new run folder; locked files will not block future runs."
            )


if __name__ == "__main__":
    unittest.main()
