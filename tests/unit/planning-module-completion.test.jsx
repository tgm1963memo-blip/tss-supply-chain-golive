/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StockPlanningPage from '../../src/features/planning/StockPlanningPage.jsx';
import ProductionPurchaseSuggestionPage from '../../src/features/planning/ProductionPurchaseSuggestionPage.jsx';
import ReservationSummaryPage from '../../src/features/planning/ReservationSummaryPage.jsx';
import ReservationWorkbenchPage from '../../src/features/sales/ReservationWorkbenchPage.jsx';
import DemandPlanPage from '../../src/features/planning/DemandPlanPage.jsx';
import ATPWorkbenchPage from '../../src/features/planning/ATPWorkbenchPage.jsx';
import ShortageReviewPage from '../../src/features/planning/ShortageReviewPage.jsx';
import * as stockPlanningService from '../../src/services/planning/stockPlanningService.js';
import * as productionService from '../../src/services/planning/productionPurchaseSuggestionService.js';
import * as reservationService from '../../src/services/planning/reservationService.js';
import * as demandPlanningService from '../../src/services/planning/demandPlanningService.js';
import * as atpService from '../../src/services/planning/atpWorkbenchService.js';
import * as reservationSourceService from '../../src/services/sales/reservationSourceService.js';
import * as inventoryService from '../../src/services/inventory/inventoryService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/planning/stockPlanningService.js');
vi.mock('../../src/services/planning/productionPurchaseSuggestionService.js');
vi.mock('../../src/services/planning/reservationService.js');
vi.mock('../../src/services/planning/demandPlanningService.js');
vi.mock('../../src/services/planning/atpWorkbenchService.js');
vi.mock('../../src/services/sales/reservationSourceService.js');
vi.mock('../../src/services/inventory/inventoryService.js');

const serviceSources = {
  stockPlanning: readFileSync(join(testDir, '../../src/services/planning/stockPlanningService.js'), 'utf8'),
  production: readFileSync(join(testDir, '../../src/services/planning/productionPurchaseSuggestionService.js'), 'utf8'),
  reservation: readFileSync(join(testDir, '../../src/services/planning/reservationService.js'), 'utf8'),
  demand: readFileSync(join(testDir, '../../src/services/planning/demandPlanningService.js'), 'utf8'),
  atp: readFileSync(join(testDir, '../../src/services/planning/atpWorkbenchService.js'), 'utf8'),
};

const seedStockRow = {
  code: '10001',
  name: 'Test SKU',
  effStock: 4200,
  reservedQty: 600,
  minStock: 2000,
  bench: 4200,
  daysMap: { avg3: 45 },
  forecastPo: 1000,
  forecastProd: 0,
  shortageQty: 0,
  recQty: 500,
  status: { key: 'ok', label: 'ปกติ' },
};

describe('Planning module — Stock & Planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stockPlanningService.isSupabaseConfigured.mockReturnValue(false);
    stockPlanningService.PS_CRITS_ALL = [
      { key: 'avg3', lbl: 'เฉลี่ย 3 เดือน' },
    ];
    stockPlanningService.getStockPlanningData.mockResolvedValue({
      rows: [seedStockRow],
      summary: { skuCount: 1, urgentCount: 0, watchCount: 0, totalStock: 4200, totalReserved: 600, totalRecQty: 500 },
      source: 'seed',
      productGroups: ['Finished Goods'],
      criteriaLabels: ['เฉลี่ย 3 เดือน'],
      periodLabel: null,
    });
  });

  afterEach(() => cleanup());

  it('renders legacy filters and table without PlaceholderCard', async () => {
    render(<StockPlanningPage />);
    expect(await screen.findByText(/Stock & Planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/Placeholder/i)).not.toBeInTheDocument();
    expect(screen.getByText('เกณฑ์เปรียบเทียบ')).toBeInTheDocument();
    expect(await screen.findByText('10001')).toBeInTheDocument();
    expect(screen.getByText(/BLOCKED_BY_GOVERNANCE/i)).toBeInTheDocument();
  });

  it('stockPlanningService uses read models only', () => {
    expect(serviceSources.stockPlanning).toMatch(/sc_web_stock_balance_view/);
    expect(serviceSources.stockPlanning).not.toMatch(/service_role/i);
    expect(serviceSources.stockPlanning).not.toMatch(/dbf/i);
  });
});

describe('Planning module — Production / Purchase Suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productionService.getProductionPurchaseSuggestions.mockResolvedValue({
      rows: [{
        sku: '10001',
        productName: 'Test',
        forecastQty: 1000,
        currentStock: 500,
        reserved: 100,
        shortage: 600,
        leadTime: 4,
        suggestedProductionQty: 660,
        suggestedPurchaseQty: 0,
        reason: 'Shortage',
      }],
      source: 'seed',
    });
  });

  afterEach(() => cleanup());

  it('renders suggestion table with governance badges', async () => {
    render(<ProductionPurchaseSuggestionPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Production \/ Purchase Suggestion/i })).toBeInTheDocument();
    expect(screen.getByText('SUGGESTION ONLY')).toBeInTheDocument();
    expect(screen.getByText(/No PO or production order creation/i)).toBeInTheDocument();
  });

  it('production service has no Express write-back', () => {
    expect(serviceSources.production).not.toMatch(/service_role/i);
    expect(serviceSources.production).not.toMatch(/dbf/i);
  });
});

describe('Planning module — Reservation Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reservationService.listReservations.mockResolvedValue([
      {
        id: 'r1',
        documentNo: 'RSV-001',
        documentType: 'reservation',
        roomCode: 'TSS',
        status: 'active',
        createdAt: '2026-06-01T00:00:00Z',
        lines: [{ requestedQty: 10, reservedQty: 8 }],
      },
    ]);
    reservationSourceService.isSupabaseConfigured.mockReturnValue(true);
  });

  afterEach(() => cleanup());

  it('renders summary cards and reservation table', async () => {
    render(<ReservationSummaryPage />);
    expect(await screen.findByText(/Reservation Summary/i)).toBeInTheDocument();
    expect(await screen.findByText('RSV-001')).toBeInTheDocument();
    expect(screen.getByText('Reservations')).toBeInTheDocument();
  });
});

describe('Planning module — Reservation Workbench', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reservationSourceService.isSupabaseConfigured.mockReturnValue(true);
    reservationSourceService.listSalesOrderReservationCandidates.mockResolvedValue([]);
    reservationSourceService.listSalesOrderFulfillmentLocationCandidates.mockResolvedValue([]);
    reservationService.listReservations.mockResolvedValue([]);
    inventoryService.listInventoryBalances.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it('renders safe mode reservation workbench', async () => {
    render(<ReservationWorkbenchPage />);
    expect(await screen.findByText(/Reservation Workbench/i)).toBeInTheDocument();
    expect(screen.getByText(/Safe mode/i)).toBeInTheDocument();
  });
});

describe('Planning module — Demand Planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    demandPlanningService.isSupabaseConfigured.mockReturnValue(true);
    demandPlanningService.listDemandPlanningCandidates.mockResolvedValue([]);
    demandPlanningService.getDemandPlanningSummary.mockResolvedValue({
      totalOpenSoDemandLines: 0,
      totalRequiredQty: 0,
      totalAvailableQty: 0,
      totalReservedQty: 0,
      totalShortageQty: 0,
      readyToPickLines: 0,
      notReservedButAvailableLines: 0,
      shortStockLines: 0,
      pickDraftExistsLines: 0,
      pickConfirmedLines: 0,
    });
    demandPlanningService.buildPlannerWorkbenchRows.mockReturnValue([]);
  });

  afterEach(() => cleanup());

  it('renders read-only demand planner workbench', async () => {
    render(<DemandPlanPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Demand Planning/i })).toBeInTheDocument();
    expect(screen.getByText(/Read-Only Notice/i)).toBeInTheDocument();
  });

  it('demand service is read-only', () => {
    expect(serviceSources.demand).toMatch(/READ-ONLY/);
    expect(serviceSources.demand).toMatch(/sc_so_pick_pack_candidate_view/);
  });
});

describe('Planning module — ATP Workbench', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    atpService.getAtpWorkbenchData.mockResolvedValue({
      rows: [{
        productCode: '10001',
        productName: 'Test SKU',
        onHandQty: 100,
        reservedQty: 20,
        incomingPoQty: 0,
        atpQty: 80,
        openSoQty: 10,
        status: 'available',
      }],
      summary: { totalOnHand: 100, totalReserved: 20, totalAtp: 80, totalIncomingPo: 0, stockoutCount: 0, lowCount: 0 },
      source: 'seed',
    });
  });

  afterEach(() => cleanup());

  it('renders ATP table from service not hardcoded demo SKUs', async () => {
    render(<ATPWorkbenchPage />);
    expect(await screen.findByText(/ATP Workbench/i)).toBeInTheDocument();
    expect(await screen.findByText('10001')).toBeInTheDocument();
    expect(screen.queryByText('FG-00100')).not.toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
  });

  it('atp service uses sc_web_atp_view', () => {
    expect(serviceSources.atp).toMatch(/sc_web_atp_view/);
    expect(serviceSources.atp).not.toMatch(/service_role/i);
  });
});

describe('Planning module — Shortage Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    demandPlanningService.isSupabaseConfigured.mockReturnValue(true);
    demandPlanningService.listDemandPlanningCandidates.mockResolvedValue([
      {
        ship_date: '2026-06-10',
        so_no: 'SO-1',
        so_line_no: '1',
        customer_name: 'Test Customer',
        product_code: '10001',
        product_name: 'SKU',
        required_qty: 100,
        available_qty: 20,
        reserved_qty: 0,
        shortage_qty: 80,
      },
    ]);
    demandPlanningService.getDemandPlanningSummary.mockResolvedValue({
      shortStockLines: 1,
      totalShortageQty: 80,
      totalRequiredQty: 100,
      totalAvailableQty: 20,
    });
  });

  afterEach(() => cleanup());

  it('renders shortage review table', async () => {
    render(<ShortageReviewPage />);
    expect(await screen.findByText(/Shortage Review/i)).toBeInTheDocument();
    expect(await screen.findByText('Test Customer')).toBeInTheDocument();
  });
});
