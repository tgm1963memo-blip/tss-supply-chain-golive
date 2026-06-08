# Live Read-only UAT Issue Log

Phase **3C** initial pass · Phase **3D** closure and human sign-off prep.

**Summary:** No Critical or High blockers. UAT-001 and UAT-002 closed in Phase 3D. UAT-003 accepted as design limitation. UAT-004 pending human governance sign-off (`docs/13_HUMAN_UAT_SIGNOFF.md`).

---

## Open issues

| Issue ID | Page | Severity | Description | Expected Result | Actual Result | Root Cause | Fix | Status | Retest Result |
|----------|------|----------|-------------|-----------------|---------------|------------|-----|--------|---------------|
| UAT-004 | Reservation Workbench | Medium | Partial safe mode | Full read-only (no reservation create) | Create reservation enabled; release disabled | Intentional golive partial safe mode per Phase 2 reservation migration | Governance decision in `docs/13_HUMAN_UAT_SIGNOFF.md` — **no code change in Phase 3D** | Open — governance | Pending human sign-off |

---

## Closed issues

| Issue ID | Page | Severity | Description | Fix | Status | Retest Result |
|----------|------|----------|-------------|-----|--------|---------------|
| UAT-001 | Available Stock | Low | Missing shared env warning banner | Added `SupabaseEnvWarning` to `AvailableStockPage.jsx` (Phase 3D) | **Closed** | PASS |
| UAT-002 | Stock Movement | Low | Missing shared env warning banner | Added `SupabaseEnvWarning` to `StockMovementPage.jsx` (Phase 3D) | **Closed** | PASS |

---

## Accepted limitations

| Issue ID | Page | Severity | Description | Expected Result | Actual Result | Root Cause | Status | Retest Result |
|----------|------|----------|-------------|-----------------|---------------|------------|--------|---------------|
| UAT-003 | WMS Dashboard, CONSI Dashboard | Low | Preview-only data, not live Supabase | Stakeholders may expect live WMS/CONSI feeds | `OperationsPreviewPage` static module data | Phase 2 migration scope — preview until backend wired in Phase 4+ | **Accepted / Design Limitation** | **Accepted** |

---

## Closed / N/A

| Issue ID | Page | Severity | Description | Status | Notes |
|----------|------|----------|-------------|--------|-------|
| — | All probed pages | — | RLS or missing table errors | N/A | All anon read probes passed 2026-06-08 |

---

## RLS / SQL reference (for future failures)

If a page fails with `42501` (permission denied) or `PGRST205` (relation not found), **do not bypass RLS in the frontend**. Apply server-side fixes such as:

```sql
-- Example: grant anon read on a view (adjust to your policy model)
-- CREATE POLICY "anon_read_sc_inventory_balance_view"
--   ON sc_inventory_balance_view FOR SELECT TO anon USING (true);
```

Log the exact `table/view`, PostgREST error code, and message in a new row above.

---

## Severity definitions

| Severity | Definition |
|----------|------------|
| **Critical** | Page crash, data write executed, or Express DBF write attempted |
| **High** | Live data completely unavailable with env configured |
| **Medium** | Safe-mode or governance gap affecting production readiness |
| **Low** | UX/documentation gap; workaround exists |

---

## Update history

| Date | Author | Change |
|------|--------|--------|
| 2026-06-08 | Cursor Agent (Phase 3C) | Initial log — 4 observations, 0 blockers |
| 2026-06-08 | Cursor Agent (Phase 3D) | Closed UAT-001, UAT-002; UAT-003 → Accepted / Design Limitation; UAT-004 → governance pending |
