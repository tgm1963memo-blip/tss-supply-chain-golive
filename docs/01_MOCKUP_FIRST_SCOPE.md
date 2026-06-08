# 01 — Mockup-First Scope

## Objective

Deliver a navigable, responsive UI shell that business users can review before any backend integration. The goal is **UAT on layout, labels, and workflows** — not functional correctness of inventory logic.

## In Scope (Phase 0)

### Layout & Navigation
- Desktop sidebar with grouped module links
- Mobile hamburger menu with overlay
- Bottom mobile quick-nav for primary modules
- Sticky topbar with global MOCKUP badge
- Responsive summary cards (1 → 2 → 4 columns)
- Horizontally scrollable data tables

### Page Shell (Every Screen)
Each of the 47 pages includes:
- Page title and purpose statement
- MOCKUP status badge
- Sample summary cards (4 KPIs)
- Sample data table with mock rows
- Workflow stepper (generic 4-step placeholder)
- User workflow notes
- Business rule notes
- Next implementation notes

### Modules Covered
| Module | Pages |
|--------|-------|
| Dashboard | 1 |
| Sales | 5 |
| Planning | 4 |
| Inventory | 3 |
| WMS | 9 |
| Consignment | 5 |
| Sample / Consumable | 5 |
| Master Data | 7 |
| Reports | 4 |
| Admin | 4 |

### Mock Data Files
- `mockSalesOrders.js`
- `mockInventory.js`
- `mockWms.js`
- `mockConsignment.js`
- `mockMasterData.js`

## Out of Scope (Phase 0)

- Supabase authentication and RLS
- Real-time subscriptions
- Express ERP read/write integration
- Stock reservation engine
- ATP calculation engine
- Barcode scanner hardware integration
- PDF/Excel export
- Multi-language (i18n)
- Role-based UI hiding (admin screens are visible to all in mockup)

## Success Criteria

1. All routes load without errors.
2. `npm run build` completes successfully.
3. Layout is usable on mobile (375px) and desktop (1280px+).
4. Business stakeholders can walk through all modules via sidebar.
5. Each page clearly states it is mockup-only data.

## UAT Focus Areas

When reviewing mockups, stakeholders should validate:
- Screen names and menu grouping
- Column headers in tables
- KPI labels on summary cards
- Workflow step labels
- Missing screens or redundant screens
- Mobile usability for warehouse-facing pages (WMS, Barcode Scan)
