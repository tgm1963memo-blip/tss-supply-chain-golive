# Golive Readiness Checklist

Phase **3F** — pre-deployment readiness for `tss-supply-chain-golive` read-only safe mode.

Complete all items before production deployment. Link evidence in the Notes column.

**Recommended go-live position:** **GO WITH LIMITATION** (pending final human sign-off in `docs/13_HUMAN_UAT_SIGNOFF.md`).

---

## Checklist

| # | Item | Status | Owner | Notes / evidence |
|---|------|:------:|-------|------------------|
| 1 | **Build passed** | ✅ | Dev | `npm run build` — Phase 3F verified |
| 2 | **Git pushed** | ☐ | Dev | Remote branch / tag: _______________ |
| 3 | **Supabase health ok** | ✅ | IT | System Control `/admin/system-control` — probe ok |
| 4 | **UAT 16/16 passed** | ✅ | QA | `docs/11_LIVE_READONLY_UAT_EXECUTION.md` |
| 5 | **Human UAT completed** | ☐ | Operations | `docs/13_HUMAN_UAT_SIGNOFF.md` — Session completed = Yes |
| 6 | **Reservation governance decided** | ☐ | Business | DEC-001 — recommended **Option B**, pending human approval |
| 7 | **Express Weight disabled** | ✅ | IT | DEC-002 approved — `EXPRESS_WEIGHT_SAFE_MODE = true` |
| 8 | **Safe mode active** | ✅ | Dev | No stock posting, GI, PO/production create, Express DBF |
| 9 | **Backup / rollback plan** | ☐ | IT | Document: _______________ |
| 10 | **User training completed** | ☐ | Operations | Attendees / date: _______________ |
| 11 | **Final GO decision** | ☐ | Sponsor | GO / GO WITH LIMITATION / HOLD — see doc 13 |

---

## Decision alignment

| Decision | Recommended | Human approved | Register |
|----------|-------------|----------------|----------|
| Go-live scope | GO WITH LIMITATION | _pending_ | doc 13 |
| DEC-001 Reservation | Option B | _pending_ | doc 14 |
| DEC-002 Express Weight | Disabled | **Approved** | doc 14 |
| DEC-003 WMS/CONSI preview | Accept with limitation | _pending_ | doc 14 |

---

## Deployment prerequisites

- [ ] `.env.local` / production env vars set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] `.env.local` **not** committed to git
- [ ] Supabase RLS allows anon **read** on required views
- [ ] Stakeholders briefed on preview-only WMS/CONSI pages (UAT-003)
- [ ] Stakeholders briefed on reservation interim safe mode (UAT-004)

---

## Rollback plan (template)

| Step | Action |
|------|--------|
| 1 | Revert to previous static build / hosting snapshot |
| 2 | Remove or rotate Supabase anon key if compromised |
| 3 | Notify operations — read-only golive suspended |
| 4 | Log incident in `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md` |

_Rollback owner:_ _______________________  
_Rollback tested:_ ☐ Yes · ☐ No

---

## Sign-off for deployment

| Role | Name | Date | GO / GO WITH LIMITATION / HOLD |
|------|------|------|--------------------------------|
| Project sponsor | | | |
| Operations lead | | | |
| IT / Supabase admin | | | |

---

## Related documents

- Human UAT: `docs/13_HUMAN_UAT_SIGNOFF.md`
- Decision register: `docs/14_GOLIVE_DECISION_REGISTER.md`
- System Control: `/admin/system-control`
- Env setup: `docs/09_SUPABASE_ENV_SETUP.md`

---

## Update history

| Date | Author | Change |
|------|--------|--------|
| 2026-06-08 | Cursor Agent (Phase 3F) | Initial checklist — automated items marked complete |
