# 06 — Next Implementation Plan

## Phase 1: Read-Only Data Layer (Recommended Next)

**Goal:** Replace static mock imports with read-only Supabase views while keeping UI unchanged.

### Tasks
1. Add Supabase client with environment variables (`.env.local`, not committed)
2. Create read-only RPC or views for: sales orders, inventory balance, WMS tasks
3. Replace `mockApi.js` stubs with `supabaseApi.js` that falls back to mock on error
4. Add loading and error states to `MockupPageShell`
5. Keep MOCKUP badge until UAT sign-off on live read data

### Exit Criteria
- Dashboard and Sales Order List show real read data
- No write mutations enabled
- Build and lint pass

---

## Phase 2: Auth & RBAC

1. Supabase Auth (email/SSO per org policy)
2. Role definitions matching Admin screens
3. Route guards hiding unauthorized modules
4. Audit log write on sensitive reads (optional)

---

## Phase 3: Reservation & ATP Engine

1. Implement BR-S01 through BR-S03
2. Reservation workbench with optimistic UI
3. ATP calculation service (warehouse + lot level)
4. Shortage alert generation job

**Explicitly deferred from Phase 0:** real stock deduction

---

## Phase 4: WMS Operations

1. Task lifecycle (create → assign → complete)
2. Receiving → Putaway chain
3. Pick wave and dispatch confirmation
4. Stock count variance workflow
5. Mobile-optimized barcode scan (camera API)

---

## Phase 5: Express ERP Integration

1. API gateway for one-way sync (Express → Supabase) initially
2. Sync Monitor with last-run timestamps and error queue
3. Controlled write-back for CN/invoice triggers (per BR-INT04)
4. Idempotent sync jobs with retry

---

## Phase 6: Consignment & Samples

1. Branch stock sync
2. Consignment SO and movement
3. Sample/consumable approval workflow with notifications
4. Usage reporting dashboards

---

## Recommended Immediate Actions

| # | Action | Owner | Est. |
|---|--------|-------|------|
| 1 | Run UAT using `03_USER_FLOW_UAT_SCRIPT.md` | Business | 1 week |
| 2 | Finalize data model (`04`) with ERP field mapping | Tech + Business | 3 days |
| 3 | Confirm business rules (`05`) priority High items | Business | 2 days |
| 4 | Set up Supabase dev project (read-only views) | Dev | 2 days |
| 5 | Implement Phase 1 for Sales + Inventory modules first | Dev | 1 sprint |

---

## Technical Debt from Mockup Shell

- Generic workflow stepper on all pages — replace with module-specific steps
- Duplicate mock data across related screens — consolidate when wiring APIs
- Admin pages reuse customer mock rows — replace with user/audit mock data
- Old Vite starter files (`src/App.jsx`, `src/App.css`) can be removed
