# 00 — Project Restart Baseline

## Purpose

This document establishes the clean restart baseline for **tss-supply-chain-golive**, a mockup-first supply chain management shell for TSS go-live planning.

## Project Status

| Attribute | Value |
|-----------|-------|
| Phase | Mockup Shell (Phase 0) |
| Backend | None connected |
| Supabase | Not connected |
| Express ERP | No write-back |
| Stock deduction | Not implemented |
| Data source | Static mock files in `src/data/` |

## Technology Stack

- **React 19** + **Vite 8**
- **React Router 7** for client-side routing
- **Lucide React** for icons
- Plain CSS (no UI framework) for full layout control and responsive behavior

## Folder Structure

```
src/
├── app/              # Router and navigation config
├── components/
│   ├── layout/       # AppLayout, Sidebar, Topbar, MobileNav
│   ├── ui/           # PageHeader, StatusBadge, SummaryCard, DataTable, WorkflowStepper
│   └── mockup/       # MockupPageShell, page defaults
├── features/         # Feature modules (dashboard, sales, wms, etc.)
├── data/             # Static mock data files
├── services/         # mockApi.js (read-only stubs)
└── styles/           # Global CSS, variables, layout, components

docs/                 # Project documentation (this folder)
```

## Constraints (Non-Negotiable for Phase 0)

1. Every screen displays **MOCKUP** badge — no live data.
2. No Supabase client initialization in production paths.
3. No Express API calls or write operations.
4. No real inventory reservation or stock deduction logic.
5. All tables and summary cards use static sample data.

## Baseline Deliverables

- [x] Enterprise folder structure
- [x] Responsive AppLayout with sidebar and mobile nav
- [x] 47 mockup pages across 10 modules
- [x] 5 mock data files
- [x] 7 documentation files
- [x] Production build verification (`npm run build`)

## Related Documents

- [01_MOCKUP_FIRST_SCOPE.md](./01_MOCKUP_FIRST_SCOPE.md)
- [02_FUNCTION_STATUS_MATRIX.md](./02_FUNCTION_STATUS_MATRIX.md)
- [06_NEXT_IMPLEMENTATION_PLAN.md](./06_NEXT_IMPLEMENTATION_PLAN.md)
