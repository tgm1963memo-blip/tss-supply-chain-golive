#!/usr/bin/env python3
"""Unit tests for sync --offset / --limit slicing and CLI."""
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from express_sync_engine import ExpressSync, parse_args
from sync_slice import OffsetLimitSlicer


class OffsetLimitSlicerTests(unittest.TestCase):
    def test_offset_zero_limit_two(self):
        slicer = OffsetLimitSlicer(offset=0, limit=2)
        results = [slicer.accept_policy_row() for _ in range(5)]
        self.assertEqual(results[:3], [True, True, False])
        self.assertEqual(slicer.policy_filtered_count, 2)
        self.assertEqual(slicer.synced_count, 2)
        self.assertEqual(slicer.rows_skipped_by_offset, 0)

    def test_offset_two_limit_two(self):
        slicer = OffsetLimitSlicer(offset=2, limit=2)
        results = [slicer.accept_policy_row() for _ in range(6)]
        self.assertEqual(results[:5], [False, False, True, True, False])
        self.assertEqual(slicer.policy_filtered_count, 4)
        self.assertEqual(slicer.synced_count, 2)
        self.assertEqual(slicer.rows_skipped_by_offset, 2)

    def test_offset_only_syncs_to_end(self):
        slicer = OffsetLimitSlicer(offset=1, limit=None)
        results = [slicer.accept_policy_row() for _ in range(4)]
        self.assertEqual(results, [False, True, True, True])
        self.assertEqual(slicer.synced_count, 3)


class ParseArgsTests(unittest.TestCase):
    def test_artrn_chunk_args(self):
        args = parse_args([
            "--room", "TSS",
            "--table", "ARTRN.DBF",
            "--since-date", "2025-01-01",
            "--limit", "2000",
            "--offset", "2000",
            "--dry-run",
        ])
        self.assertEqual(args.limit, 2000)
        self.assertEqual(args.offset, 2000)
        self.assertEqual(args.since_date, "2025-01-01")

    def test_sttrn_limit_args(self):
        args = parse_args([
            "--room", "TSS",
            "--table", "STTRN.DBF",
            "--limit", "500",
            "--dry-run",
        ])
        self.assertEqual(args.limit, 500)
        self.assertEqual(args.offset, 0)


class PolicyBypassTests(unittest.TestCase):
    def setUp(self):
        self.sync = ExpressSync.__new__(ExpressSync)

    def test_sttrn_not_blocked_with_limit(self):
        blocked = self.sync.table_requires_window_or_limit(
            "STTRN.DBF",
            "blocked_full_history_by_default",
            {"limit": 500},
        )
        self.assertFalse(blocked)

    def test_sttrn_not_blocked_with_offset(self):
        blocked = self.sync.table_requires_window_or_limit(
            "STTRN.DBF",
            "blocked_full_history_by_default",
            {"offset": 100},
        )
        self.assertFalse(blocked)

    def test_sttrn_blocked_without_slice_controls(self):
        blocked = self.sync.table_requires_window_or_limit(
            "STTRN.DBF",
            "blocked_full_history_by_default",
            {},
        )
        self.assertTrue(blocked)


class HelpTextTests(unittest.TestCase):
    def test_sync_entry_help_shows_offset(self):
        import subprocess

        result = subprocess.run(
            [sys.executable, str(SCRIPT_DIR / "sync_express_readonly.py"), "--help"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("--offset", result.stdout)
        self.assertIn("--limit", result.stdout)


if __name__ == "__main__":
    unittest.main()
