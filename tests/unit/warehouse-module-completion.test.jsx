/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StockBalancePage from '../../src/features/inventory/StockBalancePage.jsx';
import AvailableStockPage from '../../src/features/warehouse/inventory/AvailableStockPage.jsx';
import StockMovementPage from '../../src/features/inventory/StockMovementPage.jsx';
import InventoryLedgerPage from '../../src/features/inventory/InventoryLedgerPage.jsx';
import StockAdjustmentPage from '../../src/features/wms/StockAdjustmentPage.jsx';
import StockCountPage from '../../src/features/wms/StockCountPage.jsx';
import LotExpiryControlPage from '../../src/features/warehouse/inventory/LotExpiryControlPage.jsx';
import WMSDashboardPage from '../../src/features/wms/WMSDashboardPage.jsx';
import ReceivingPage from '../../src/features/wms/ReceivingPage.jsx';
import PutawayPage from '../../src/features/wms/PutawayPage.jsx';
import TransferPage from '../../src/features/wms/TransferPage.jsx';
import PickingPackingPage from '../../src/features/warehouse/wms/PickingPackingPage.jsx';
import DispatchGoodsIssuePage from '../../src/features/warehouse/wms/DispatchGoodsIssuePage.jsx';
import ScanCenterPage from '../../src/features/warehouse/wms/ScanCenterPage.jsx';
import HandheldOperationsPage from '../../src/features/warehouse/wms/HandheldOperationsPage.jsx';
import * as warehouseInventoryService from '../../src/services/warehouse/warehouseInventoryService.js';
import * as stockAdjustmentService from '../../src/services/warehouse/stockAdjustmentService.js';
import * as stockMovementService from '../../src/services/warehouse/stockMovementService.js';
import * as wmsDashboardService from '../../src/services/warehouse/wmsDashboardService.js';
import * as receivingService from '../../src/services/warehouse/receivingService.js';
import * as movementLedgerService from '../../src/services/wms/movementLedgerReportService.js';
import * as stockCountService from '../../src/services/wms/stockCountService.js';
import * as storageAgingService from '../../src/services/wms/storageAgingReportService.js';
import * as putawayService from '../../src/services/wms/putawayService.js';
import * as transferService from '../../src/services/wms/transferService.js';
import * as pickingService from '../../src/services/wms/pickingService.js';
import * as dispatchService from '../../src/services/wms/dispatchService.js';
import * as pickListService from '../../src/services/picking/pickListCandidateService.js';
import * as handheldReceivingService from '../../src/services/wms/handheldReceivingService.js';
import * as scanCenterService from '../../src/services/warehouse/scanCenterService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/warehouse/warehouseInventoryService.js');
vi.mock('../../src/services/warehouse/stockAdjustmentService.js');
vi.mock('../../src/services/warehouse/stockMovementService.js');
vi.mock('../../src/services/warehouse/wmsDashboardService.js');
vi.mock('../../src/services/warehouse/receivingService.js');
vi.mock('../../src/services/wms/movementLedgerReportService.js');
vi.mock('../../src/services/wms/stockCountService.js');
vi.mock('../../src/services/wms/storageAgingReportService.js');
vi.mock('../../src/services/wms/putawayService.js');
vi.mock('../../src/services/wms/transferService.js');
vi.mock('../../src/services/wms/pickingService.js');
vi.mock('../../src/services/wms/dispatchService.js');
vi.mock('../../src/services/picking/pickListCandidateService.js');
vi.mock('../../src/services/wms/handheldReceivingService.js');
vi.mock('../../src/services/wms/handheldPutawayService.js', () => ({
  getHandheldPutawaySessions: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

const serviceSources = {
  warehouseInventory: readFileSync(join(testDir, '../../src/services/warehouse/warehouseInventoryService.js'), 'utf8'),
  stockAdjustment: readFileSync(join(testDir, '../../src/services/warehouse/stockAdjustmentService.js'), 'utf8'),
  stockMovement: readFileSync(join(testDir, '../../src/services/warehouse/stockMovementService.js'), 'utf8'),
  wmsDashboard: readFileSync(join(testDir, '../../src/services/warehouse/wmsDashboardService.js'), 'utf8'),
  receiving: readFileSync(join(testDir, '../../src/services/warehouse/receivingService.js'), 'utf8'),
  scanCenter: readFileSync(join(testDir, '../../src/services/warehouse/scanCenterService.js'), 'utf8'),
};

const seedBalance = {
  rows: [{
    productCode: '10001',
    productName: 'Test SKU',
    warehouseCode: 'WH02',
    locationCode: 'R01-A1',
    lotNo: 'LOT-1',
    calculatedOnHandQty: 1200,
    reservedQty: 200,
    availableQty: 1000,
  }],
  summary: { totalLines: 1, totalOnHand: 1200, totalAvailable: 1000, totalReserved: 200, holdLines: 0, warehouseCount: 1 },
  warehouses: ['WH02'],
  source: 'seed',
};

describe('Warehouse module — Stock Balance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warehouseInventoryService.getStockBalancePageData.mockResolvedValue(seedBalance);
  });

  afterEach(() => cleanup());

  it('renders live balance table without hardcoded FG-00100', async () => {
    render(<StockBalancePage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Stock Balance/i })).toBeInTheDocument();
    expect(await screen.findByText('10001')).toBeInTheDocument();
    expect(screen.queryByText('FG-00100')).not.toBeInTheDocument();
    expect(screen.getByText(/BLOCKED_BY_GOVERNANCE/i)).toBeInTheDocument();
  });

  it('warehouseInventoryService uses read models only', () => {
    expect(serviceSources.warehouseInventory).toMatch(/sc_inventory_balance_view|listStockBalances/);
    expect(serviceSources.warehouseInventory).not.toMatch(/service_role/i);
  });
});

describe('Warehouse module — Available Stock', () => {
  beforeEach(() => {
    warehouseInventoryService.getAvailableStockData.mockResolvedValue(seedBalance);
  });

  afterEach(() => cleanup());

  it('renders available stock from service', async () => {
    render(<AvailableStockPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Available Stock/i })).toBeInTheDocument();
    expect(await screen.findByText('10001')).toBeInTheDocument();
  });
});

describe('Warehouse module — Stock Movement', () => {
  beforeEach(() => {
    stockMovementService.listStockMovements.mockResolvedValue([
      {
        id: '1',
        roomCode: 'TSS',
        documentNo: 'MV-001',
        documentType: 'transfer',
        movementType: 'transfer',
        productCode: '10001',
        warehouseCode: 'WH01',
        locationCode: 'A1',
        lotNo: 'LOT-1',
        qty: 10,
        uom: 'KG',
        status: 'synced',
        createdAt: '2026-06-01T00:00:00Z',
      },
    ]);
  });

  afterEach(() => cleanup());

  it('renders movement table read-only banner', async () => {
    render(<StockMovementPage />);
    expect(await screen.findByText(/Stock Movement/i)).toBeInTheDocument();
    expect(screen.getByText(/does not post ledger/i)).toBeInTheDocument();
  });

  it('stockMovementService reads sc_inventory_ledger', () => {
    expect(serviceSources.stockMovement).toMatch(/sc_inventory_ledger/);
  });
});

describe('Warehouse module — Inventory Ledger', () => {
  beforeEach(() => {
    movementLedgerService.getMovementLedgerRows.mockResolvedValue({ data: [], error: null });
    movementLedgerService.getMovementLedgerSummary.mockResolvedValue({ data: null, error: null });
    movementLedgerService.getMovementTypeBreakdown.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => cleanup());

  it('renders ledger report shell', async () => {
    render(<InventoryLedgerPage />);
    expect(await screen.findByText(/Customer Stock Movement Ledger/i)).toBeInTheDocument();
  });
});

describe('Warehouse module — Stock Adjustment', () => {
  beforeEach(() => {
    stockAdjustmentService.listStockAdjustmentRequests.mockResolvedValue([]);
    stockAdjustmentService.isSupabaseConfigured.mockReturnValue(true);
    stockAdjustmentService.createStockAdjustmentRequest.mockResolvedValue({
      requestNo: 'ADJ-1',
      expressQueueStatus: 'blocked_by_governance',
    });
  });

  afterEach(() => cleanup());

  it('renders request form with governance queue', async () => {
    render(<StockAdjustmentPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Stock Adjustment/i })).toBeInTheDocument();
    expect(screen.getByText(/blocked_by_governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Adjustment Request/i)).toBeInTheDocument();
  });

  it('stockAdjustmentService blocks Express posting', () => {
    expect(serviceSources.stockAdjustment).toMatch(/blocked_by_governance/);
    expect(serviceSources.stockAdjustment).toMatch(/sc_stock_adjustment_requests/);
  });
});

describe('Warehouse module — Cycle Count', () => {
  beforeEach(() => {
    stockCountService.getStockCountDocuments.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => cleanup());

  it('renders stock count read-only list', async () => {
    render(<StockCountPage />);
    expect(await screen.findByRole('heading', { level: 2, name: /^Stock Count$/ })).toBeInTheDocument();
    expect(screen.getByText(/no cycle count posting/i)).toBeInTheDocument();
  });
});

describe('Warehouse module — Lot / Expiry', () => {
  beforeEach(() => {
    storageAgingService.getStorageAgingRows.mockResolvedValue({ data: [], error: null });
    storageAgingService.getStorageAgingSummary.mockResolvedValue({ data: null, error: null });
    storageAgingService.getExpiryAlertRows.mockResolvedValue({ data: [], error: null });
    storageAgingService.groupAgingByCustomer.mockReturnValue([]);
    storageAgingService.groupAgingByWarehouse.mockReturnValue([]);
  });

  afterEach(() => cleanup());

  it('renders storage aging report', async () => {
    render(<LotExpiryControlPage />);
    expect(await screen.findByRole('heading', {
      level: 2,
      name: /Storage Aging \/ Lot \/ Expiry/i,
    })).toBeInTheDocument();
  });
});

describe('Warehouse module — WMS Dashboard', () => {
  beforeEach(() => {
    wmsDashboardService.getWmsDashboardData.mockResolvedValue({
      stockRows: [{ productCode: '10001', productName: 'Test', qty: 100, unit: 'KG' }],
      summary: { skuCount: 1, totalQty: 100, lowStockSkus: 0, syncedAt: new Date().toISOString() },
      links: [{ path: '/warehouse/wms/receiving', label: 'Receiving', icon: '📥' }],
      source: 'seed',
    });
  });

  afterEach(() => cleanup());

  it('renders WMS dashboard without OperationsPreviewPage', async () => {
    render(
      <MemoryRouter>
        <WMSDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /WMS Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Receiving/i })).toBeInTheDocument();
    expect(screen.queryByText(/Operations Preview/i)).not.toBeInTheDocument();
  });

  it('wmsDashboardService reads sc_web_stock_balance_view', () => {
    expect(serviceSources.wmsDashboard).toMatch(/sc_web_stock_balance_view/);
  });
});

describe('Warehouse module — Receiving', () => {
  beforeEach(() => {
    receivingService.getReceivingSchedule.mockResolvedValue({
      rows: [{ documentNo: 'PO-001', sourceType: 'Supplier', supplierName: 'Test Co', expectedQty: 100, receivedQty: 0, status: 'pending' }],
      summary: { expectedToday: 1, inProgress: 0, completed: 0, discrepancies: 0 },
      source: 'seed',
    });
  });

  afterEach(() => cleanup());

  it('renders receiving schedule safe mode', async () => {
    render(<ReceivingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /WMS Receiving/i })).toBeInTheDocument();
    expect(await screen.findByText('PO-001')).toBeInTheDocument();
  });

  it('receivingService uses sc_express_transfers', () => {
    expect(serviceSources.receiving).toMatch(/sc_express_transfers/);
  });
});

describe('Warehouse module — Putaway / Transfer', () => {
  beforeEach(() => {
    putawayService.getPutawayDocuments.mockResolvedValue({ data: [], error: null });
    transferService.getTransferDocuments.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => cleanup());

  it('renders putaway read-only list', async () => {
    render(<PutawayPage />);
    expect(await screen.findByRole('heading', { level: 2, name: /^Putaway$/ })).toBeInTheDocument();
  });

  it('renders transfer read-only list', async () => {
    render(<TransferPage />);
    expect(await screen.findByText(/Internal Transfer/i)).toBeInTheDocument();
  });
});

describe('Warehouse module — Picking & Dispatch', () => {
  beforeEach(() => {
    pickingService.getPickingDocuments.mockResolvedValue({ data: [], error: null });
    dispatchService.getDispatchDocuments.mockResolvedValue({ data: [], error: null });
    pickListService.listPickListCandidates.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it('renders picking workbench tabs', async () => {
    render(<PickingPackingPage />);
    expect(await screen.findByRole('heading', { level: 2, name: /Picking & Packing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SO Pick-Pack/i })).toBeInTheDocument();
  });

  it('renders dispatch workbench tabs', async () => {
    render(<DispatchGoodsIssuePage />);
    expect(await screen.findByText(/Dispatch \/ Goods Issue/i)).toBeInTheDocument();
    expect(screen.getByText(/Outbound \/ Goods Issue/i)).toBeInTheDocument();
  });
});

describe('Warehouse module — Scan / Handheld', () => {
  beforeEach(() => {
    handheldReceivingService.getHandheldReceivingSessions.mockResolvedValue({ data: [], error: null });
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  it('renders scan center workbench with tgm-table', async () => {
    render(<ScanCenterPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Scan Center/i })).toBeInTheDocument();
    expect(screen.getByText(/Log Scan \(Safe Mode\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan Log/i)).toBeInTheDocument();
  });

  it('scanCenterService logs locally without Express write-back', () => {
    expect(serviceSources.scanCenter).not.toMatch(/service_role|dbf/i);
    expect(serviceSources.scanCenter).toMatch(/logged_safe_mode/);
  });

  it('renders handheld operations sessions', async () => {
    render(<HandheldOperationsPage />);
    expect(await screen.findByText(/Handheld Operations/i)).toBeInTheDocument();
  });
});
