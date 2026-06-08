# Supabase Environment Setup

Phase **3A** — production readiness for read-only live validation in `tss-supply-chain-golive`.

## Required environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** (public) API key |

These are read at build time by Vite and exposed to the browser via `import.meta.env`.

## Create `.env.local`

1. Copy the example file in the project root:

   ```bash
   cp .env.example .env.local
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Edit `.env.local` and paste your Supabase project values:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Restart the dev server after changing env vars:

   ```bash
   npm run dev
   ```

## Warning: never commit `.env.local`

- `.env.local` contains secrets and project-specific credentials.
- The repo `.gitignore` excludes `.env`, `.env.local`, and `.env.*.local`.
- Only commit `.env.example` with empty placeholders.
- Use your team’s secret manager or Supabase dashboard for real keys.

## Verify connection

### Option A — System Control page (recommended)

1. Start the app: `npm run dev`
2. Open **Admin / Control → System Control** (`/admin/system-control`)
3. Review **Supabase Health Check**:
   - ENV configured: Yes
   - URL present: Yes
   - ANON key present: Yes
   - Connection status: **ok**
4. Click **Re-run check** after env changes.

### Option B — Browser console

With env configured, pages that load Supabase data should show live rows instead of empty/seed preview. Executive dashboards should show numeric KPIs instead of em dashes (`—`).

### Health check service

Programmatic check:

```js
import { checkSupabaseHealth } from '../services/system/supabaseHealthService.js';

const result = await checkSupabaseHealth();
// result.status: 'missing_env' | 'configured' | 'connection_error' | 'ok'
```

The probe performs a **read-only** `HEAD` count on `sc_products` — no writes.

## Safe mode (always on)

Even with Supabase connected, this golive build remains **read-only / safe mode**:

- No stock posting or ledger writes
- No reservation create/release (UI may preview; writes blocked where enforced)
- No production order or PO creation
- No Express DBF write-back (Express Weight remains design-only)

See `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md`.

## Pages that depend on Supabase

When env is missing, these pages show **empty data, seed preview, or placeholder KPIs** and a warning banner — they must not crash.

### Executive Dashboard

| Menu | Route | Primary views / tables |
|------|-------|------------------------|
| Management Dashboard | `/executive/management` | Aggregated KPIs from SO, reservation, pick, dispatch services |
| Sales Overview | `/executive/sales-overview` | `sc_sales_dashboard_*`, SO metrics |
| Stock Overview | `/executive/stock-overview` | `sc_inventory_balance_view` |
| Shortage Overview | `/executive/shortage-overview` | Pick-pack / shortage views |
| Order Fulfillment | `/executive/order-fulfillment` | Pipeline metrics |
| CONSI Overview | `/executive/consi-overview` | Preview structure (partial seed) |

### Sales

| Menu | Route | Notes |
|------|-------|-------|
| Sales Order | `/sales/orders` | SO list from Supabase |
| Sales Order Detail | `/sales/orders/:id` | SO header/lines |
| Sales Overview | `/sales/overview` | Sales dashboard metrics |
| Sales Forecast | `/sales/forecast` | Legacy forecast UI; optional Supabase for extended data |

### Planning & Allocation

| Menu | Route | Notes |
|------|-------|-------|
| Demand Planning | `/planning/demand` | Demand planning views |
| Reservation Workbench | `/planning/reservation` | `sc_so_reservation_candidate_view`, reservations |
| Shortage Review | `/planning/shortage-review` | Shortage candidates |
| Reservation Summary | `/planning/reservation-summary` | Reservation aggregates |
| ATP Workbench | `/planning/atp` | Live ATP from balance + SO; **seed fallback** when env missing |
| Production / Purchase Suggestion | `/planning/production-purchase` | **Seed fallback** when env missing |

### Warehouse — Inventory

| Menu | Route | Notes |
|------|-------|-------|
| Stock Balance | `/warehouse/inventory/balance` | `sc_inventory_balance_view` |
| Available Stock | `/warehouse/inventory/available` | `sc_inventory_available_view` |
| Stock Movement | `/warehouse/inventory/movement` | Movement / ledger reports |

### Warehouse — WMS

| Menu | Route | Notes |
|------|-------|-------|
| WMS Dashboard | `/warehouse/wms` | Operations preview + WMS document services |
| Receiving / Putaway / Transfer | `/warehouse/wms/*` | WMS document lists |
| Picking & Packing | `/warehouse/wms/picking-packing` | Pick candidates, picking docs |
| Dispatch / Goods Issue | `/warehouse/wms/dispatch-goods-issue` | Dispatch documents |

### Consignment

| Menu | Route | Notes |
|------|-------|-------|
| CONSI Dashboard & sub-pages | `/consignment/*` | Operations preview (modern trade) |

### Master Data

| Menu | Route | Notes |
|------|-------|-------|
| Product Master | `/master-data/products` | `sc_products` |
| Customer Master | `/master-data/customers` | `sc_customers` |
| Warehouse / Location / UOM / SKU | `/master-data/*` | Respective `sc_*` tables |
| Customer Branch / Room-Company | `/master-data/customer-branch`, `/master-data/room-company` | Seed preview (Phase 2J) |

### Admin / Control

| Menu | Route | Notes |
|------|-------|-------|
| System Control | `/admin/system-control` | Supabase health check |

## Related documents

- `docs/10_LIVE_READONLY_VALIDATION_PLAN.md` — UAT checklist for live read-only validation
- `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md` — Express weight safe mode
- `docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md` — page migration matrix
