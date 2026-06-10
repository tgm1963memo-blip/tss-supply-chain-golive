#!/usr/bin/env python3
"""Run the full local mirror pipeline: sync -> build -> push compact read models."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable


def run_step(label: str, script: str, extra_args: list[str] | None = None) -> int:
    cmd = [PYTHON, str(SCRIPT_DIR / script)] + (extra_args or [])
    print(f"\n=== {label} ===", flush=True)
    print(" ".join(cmd), flush=True)
    completed = subprocess.run(cmd, cwd=str(SCRIPT_DIR))
    if completed.returncode != 0:
        print(f"[PIPELINE] step failed: {label} (exit {completed.returncode})", flush=True)
    return completed.returncode


def parse_args():
    parser = argparse.ArgumentParser(description="Run local mirror pipeline end-to-end.")
    parser.add_argument("--room", action="append", help="Room code (repeatable)")
    parser.add_argument("--skip-sync", action="store_true")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--skip-push", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Dry-run sync + push steps")
    parser.add_argument("--limit", type=int, help="Limit records during sync (testing)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    sync_args = []
    if args.room:
        for room in args.room:
            sync_args.extend(["--room", room])
    if args.limit is not None:
        sync_args.extend(["--limit", str(args.limit)])
    if args.dry_run:
        sync_args.append("--dry-run")

    push_args = ["--dry-run"] if args.dry_run else []

    if not args.skip_sync:
        code = run_step("Sync Express -> Local Mirror", "sync_express_to_local_mirror.py", sync_args)
        if code != 0:
            return code

    if not args.skip_build:
        code = run_step("Build Local Read Models", "build_read_models_from_local.py")
        if code != 0:
            return code

    if not args.skip_push:
        code = run_step("Push Read Models -> Supabase", "push_read_models_to_supabase.py", push_args)
        if code != 0:
            return code

    print("\n[PIPELINE] complete", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
