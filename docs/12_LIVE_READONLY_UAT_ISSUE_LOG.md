# Live Read-only UAT Issue Log

Phase **3C** — issues and observations from initial UAT pass (2026-06-08).

**Summary:** No Critical or High blockers. Four Low/Medium observations logged for follow-up; all pages marked **PASS** for golive read-only scope.

---

## Open issues

| Issue ID | Page | Severity | Description | Expected Result | Actual Result | Root Cause | Fix | Status | Retest Result |
|----------|------|----------|-------------|-----------------|---------------|------------|-----|--------|---------------|
| UAT-001 | Available Stock | Low | Missing shared env warning banner | `SupabaseEnvWarning` when env missing | Error shown in DataTable only; page does not crash | Page predates Phase 3B `SupabaseEnvWarning` component | Add `SupabaseEnvWarning` to `AvailableStockPage.jsx` | Open — enhancement | PASS (functional) |
| UAT-002 | Stock Movement | Low | Missing shared env warning banner | Clear warning when env missing | Empty table, no banner | Page predates Phase 3B warning component | Add `SupabaseEnvWarning` to `StockMovementPage.jsx` | Open — enhancement | PASS (functional) |
| UAT-003 | WMS Dashboard, CONSI Dashboard | Low | Preview-only data, not live Supabase | Stakeholders may expect live WMS/CONSI feeds | `OperationsPreviewPage` static module data | Phase 2 migration scope — preview until backend wired | Document in matrix; wire live views in Phase 4+ | Accepted | PASS |
| UAT-004 | Reservation Workbench | Medium | Partial safe mode | Full read-only (no reservation create) | Create reservation enabled; release disabled | Intentional golive partial safe mode per Phase 2 reservation migration | Governance sign-off before enabling release; optional disable create in stricter mode | Accepted — governance | PASS |

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
