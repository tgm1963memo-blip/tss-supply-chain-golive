/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { runLegacyAudit } from '../../scripts/audit/legacy_function_coverage_check.js';
import { CRITICAL_HANDLERS, LEGACY_WORKFLOW_FUNCTIONS } from '../../scripts/audit/legacy-registry.js';

describe('Legacy function coverage controller', () => {
  const summary = runLegacyAudit({ dryRun: true });

  it('finds legacy pg* functions in index.html', () => {
    expect(summary.legacyPgFunctionsFound).toBeGreaterThan(10);
    expect(summary.legacyPgFunctions).toContain('pgCustReg');
    expect(summary.legacyPgFunctions).toContain('pgMySales');
  });

  it('critical legacy handlers are mapped (route + real page, not MISSING)', () => {
    const missingCritical = summary.entries.filter(
      (e) => e.critical && e.status === 'MISSING',
    );
    expect(missingCritical.map((e) => e.legacyFunction)).toEqual([]);
  });

  it('each CRITICAL_HANDLERS registry entry exists with route', () => {
    for (const handler of CRITICAL_HANDLERS) {
      const entry = summary.entries.find((e) => e.legacyFunction === handler);
      expect(entry, `No registry entry for ${handler}`).toBeTruthy();
      expect(entry.routeFound, `${handler} missing route`).toBe(true);
      expect(entry.pageExists, `${handler} missing page file`).toBe(true);
    }
  });

  it('customer registration workflow functions are mapped in service/page', () => {
    const workflowNames = LEGACY_WORKFLOW_FUNCTIONS.map((w) => w.name);
    expect(workflowNames).toEqual(
      expect.arrayContaining(['_crSave', 'crConfirmApproval', 'CR_DOC_SLOTS', 'custreg_subs']),
    );

    const wfResults = summary.workflowEntries.filter((w) =>
      ['_crSave', 'crConfirmApproval', 'CR_DOC_SLOTS', 'custreg_subs'].includes(w.legacyFunction),
    );
    const unmapped = wfResults.filter((w) => !w.mapped);
    expect(unmapped.map((w) => w.legacyFunction)).toEqual([]);
  });

  it('inventory audit produces status counts', () => {
    expect(summary.totalRegistryEntries).toBeGreaterThan(15);
    expect(summary.totalComplete + summary.totalPartial + summary.totalMissing + summary.totalBlocked)
      .toBe(summary.totalRegistryEntries);
  });
});
