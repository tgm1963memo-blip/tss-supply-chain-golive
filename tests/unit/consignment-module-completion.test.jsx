/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConsignmentDashboardPage from '../../src/features/consignment/ConsignmentDashboardPage.jsx';
import ConsignmentSOPage from '../../src/features/consignment/ConsignmentSOPage.jsx';
import BranchStockPage from '../../src/features/consignment/BranchStockPage.jsx';
import ConsignmentMovementPage from '../../src/features/consignment/ConsignmentMovementPage.jsx';
import SellOutRecordPage from '../../src/features/consignment/SellOutRecordPage.jsx';
import ReturnFromBranchPage from '../../src/features/consignment/ReturnFromBranchPage.jsx';
import ConsignmentReturnCNPage from '../../src/features/consignment/ConsignmentReturnCNPage.jsx';
import * as consignmentService from '../../src/services/consignment/consignmentService.js';
import * as branchStockService from '../../src/services/consignment/branchStockService.js';
import * as consignmentMovementService from '../../src/services/consignment/consignmentMovementService.js';
import * as sellOutService from '../../src/services/consignment/sellOutService.js';
import * as consignmentReturnCnService from '../../src/services/consignment/consignmentReturnCnService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/consignment/consignmentService.js');
vi.mock('../../src/services/consignment/branchStockService.js');
vi.mock('../../src/services/consignment/consignmentMovementService.js');
vi.mock('../../src/services/consignment/sellOutService.js');
vi.mock('../../src/services/consignment/consignmentReturnCnService.js');

const serviceSources = {
  consignment: readFileSync(join(testDir, '../../src/services/consignment/consignmentService.js'), 'utf8'),
  branchStock: readFileSync(join(testDir, '../../src/services/consignment/branchStockService.js'), 'utf8'),
  movement: readFileSync(join(testDir, '../../src/services/consignment/consignmentMovementService.js'), 'utf8'),
  sellOut: readFileSync(join(testDir, '../../src/services/consignment/sellOutService.js'), 'utf8'),
  returnCn: readFileSync(join(testDir, '../../src/services/consignment/consignmentReturnCnService.js'), 'utf8'),
};

const dashboardSeed = {
  rows: [],
  grouped: [{
    customerCode: 'BR-CHI-01',
    customerName: 'Chiang Mai Branch',
    branchCode: 'BR-CHI-01',
    qty: 85,
    amount: 7225,
    products: [{ productCode: 'SKU-FZ-001', productName: 'Frozen Chicken', qty: 85, amount: 7225 }],
  }],
  summary: { totalQty: 85, totalAmount: 7225, customerCount: 1, productCount: 1, rowCount: 1 },
  options: { customers: [['BR-CHI-01', 'Chiang Mai Branch']], products: [['SKU-FZ-001', 'Frozen Chicken']], branches: ['BR-CHI-01'] },
  links: [{ path: '/consignment/so', label: 'Consignment SO', icon: '📋' }],
  source: 'seed',
};

const branchStockSeed = {
  rows: [{
    branchCode: 'BR-CHI-01',
    branchName: 'Chiang Mai Branch',
    productCode: 'SKU-FZ-001',
    productName: 'Frozen Chicken Breast 1kg',
    balanceQty: 240,
    minQty: 20,
    maxQty: 300,
    status: 'normal',
  }],
  summary: { branchCount: 1, skuLines: 1, lowStockLines: 0, totalBalanceQty: 240, estimatedValue: 20400 },
  branches: ['BR-CHI-01'],
  source: 'seed',
};

beforeEach(() => {
  vi.clearAllMocks();
  consignmentService.getConsignmentDashboardData.mockResolvedValue(dashboardSeed);
  consignmentService.listConsignmentSoOrders.mockResolvedValue([]);
  consignmentService.listConsignmentSoRequests.mockResolvedValue([]);
  consignmentService.isSupabaseConfigured.mockReturnValue(true);
  branchStockService.getBranchStockPageData.mockResolvedValue(branchStockSeed);
  branchStockService.isSupabaseConfigured.mockReturnValue(true);
  consignmentMovementService.listConsignmentMovements.mockResolvedValue([]);
  consignmentMovementService.listConsignmentMovementRequests.mockResolvedValue([]);
  consignmentMovementService.isSupabaseConfigured.mockReturnValue(true);
  sellOutService.listSellOutRecords.mockResolvedValue([]);
  sellOutService.summarizeSellOut.mockReturnValue({ recordCount: 0, totalSellQty: 0, branchCount: 0, pendingCount: 0 });
  sellOutService.isSupabaseConfigured.mockReturnValue(true);
  consignmentReturnCnService.listReturnFromBranchRequests.mockResolvedValue([]);
  consignmentReturnCnService.listConsignmentReturnCnRequests.mockResolvedValue([]);
  consignmentReturnCnService.isSupabaseConfigured.mockReturnValue(true);
});

afterEach(() => cleanup());

describe('Consignment module — Dashboard', () => {
  it('renders CONSI dashboard with KPIs and filters', async () => {
    render(
      <MemoryRouter>
        <ConsignmentDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /CONSI/i })).toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
    expect(screen.getByText('CONSI Qty (kg)')).toBeInTheDocument();
    expect(screen.getAllByText(/Chiang Mai Branch/i).length).toBeGreaterThan(0);
  });

  it('consignmentService has no Express write-back', () => {
    expect(serviceSources.consignment).not.toMatch(/service_role|dbf/i);
    expect(serviceSources.consignment).toMatch(/blocked_by_governance/);
  });
});

describe('Consignment module — SO', () => {
  it('renders SO workbench tabs', async () => {
    render(<ConsignmentSOPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Consignment SO/i })).toBeInTheDocument();
    expect(screen.getByText(/Express SO \(Read\)/i)).toBeInTheDocument();
    expect(screen.getByText(/New SO Request/i)).toBeInTheDocument();
  });
});

describe('Consignment module — Branch Stock', () => {
  it('renders branch stock table from service', async () => {
    render(<BranchStockPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Branch Stock/i })).toBeInTheDocument();
    expect(await screen.findByText('SKU-FZ-001')).toBeInTheDocument();
  });

  it('branchStockService reads from view with safe empty fallback', () => {
    expect(serviceSources.branchStock).toMatch(/sc_web_consi_branch_stock_view/);
    expect(serviceSources.branchStock).not.toMatch(/service_role|dbf/i);
  });
});

describe('Consignment module — Movement', () => {
  it('renders movement workbench', async () => {
    render(<ConsignmentMovementPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Consignment Movement/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Submit Movement Request/i })).toBeInTheDocument();
  });
});

describe('Consignment module — Sell-out', () => {
  it('renders sell-out form and table', async () => {
    render(<SellOutRecordPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Sell-out Record/i })).toBeInTheDocument();
    expect(screen.getByText(/Submit Sell-out Record/i)).toBeInTheDocument();
  });

  it('sellOutService uses blocked_by_governance', () => {
    expect(serviceSources.sellOut).toMatch(/blocked_by_governance/);
  });
});

describe('Consignment module — Return from Branch', () => {
  it('renders return request workflow', async () => {
    render(<ReturnFromBranchPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Return from Branch/i })).toBeInTheDocument();
    expect(screen.getByText(/Submit Return Request/i)).toBeInTheDocument();
  });
});

describe('Consignment module — Return CN', () => {
  it('renders CONSI CN request workflow', async () => {
    render(<ConsignmentReturnCNPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /CONSI Return \/ CN/i })).toBeInTheDocument();
    expect(screen.getByText(/Submit CONSI CN Request/i)).toBeInTheDocument();
  });

  it('consignmentReturnCnService has no Express CN posting', () => {
    expect(serviceSources.returnCn).not.toMatch(/service_role|dbf|armas/i);
    expect(serviceSources.returnCn).toMatch(/sc_consi_return_cn_requests/);
  });
});
