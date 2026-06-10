/**
 * @vitest-environment node
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const syncDir = join(root, 'scripts/express-readonly-sync');

describe('sync offset CLI', () => {
  it('sync_express_readonly.py --help shows --offset', () => {
    const out = execSync('python sync_express_readonly.py --help', {
      cwd: syncDir,
      encoding: 'utf8',
    });
    expect(out).toMatch(/--offset/);
    expect(out).toMatch(/--limit/);
  });

  it('express_sync_engine maps ARTRN chunk flags', () => {
    const source = readFileSync(join(syncDir, 'express_sync_engine.py'), 'utf8');
    expect(source).toMatch(/parser\.add_argument\("--offset"/);
    expect(source).toMatch(/"offset": args\.offset/);
    expect(source).toMatch(/OffsetLimitSlicer/);
  });

  it('express_sync_engine uses per-run DBF cache directory', () => {
    const source = readFileSync(join(syncDir, 'express_sync_engine.py'), 'utf8');
    expect(source).toMatch(/make_run_cache_root/);
    expect(source).toMatch(/run_cache_root/);
    expect(source).not.toMatch(/DBF_TEMP_CACHE_PATH \/ room_code/);
  });
});
