/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManagementDashboardPage from '../../src/features/executive/ManagementDashboardPage.jsx';
import SKUSettingsPage from '../../src/features/master-data/SKUSettingsPage.jsx';
import AdminReportsPage from '../../src/features/admin/AdminReportsPage.jsx';
import * as executiveDashboardService from '../../src/services/executive/executiveDashboardService.js';
import * as skuAdminService from '../../src/services/master-data/skuAdminService.js';
import * as adminReportsService from '../../src/services/admin/adminReportsService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/executive/executiveDashboardService.js');
vi.mock('../../src/services/master-data/skuAdminService.js');
vi.mock('../../src/services/admin/adminReportsService.js');

const serviceSources = {
  executive: readFileSync(join(testDir, '../../src/services/executive/executiveDashboardService.js'), 'utf8'),
  skuAdmin: readFileSync(join(testDir, '../../src/services/master-data/skuAdminService.js'), 'utf8'),
  adminReports: readFileSync(join(testDir, '../../src/services/admin/adminReportsService.js'), 'utf8'),
};

const executiveSeed = {
  source: 'live',
  sync: { lastSyncTime: '2026-06-01T10:00:00Z', soHeadersSynced: 10, soLinesSynced: 40, stockRowsSynced: 100, failedRecords: 0 },
  sales: { soCount: 12, openCount: 3, reservedCount: 5, releasedCount: 4 },
  stock: { totalOnHand: 5000, totalAvailable: 4200, totalReserved: 800, locations: 25 },
  shortage: { shortStockLines: 2, readyToPickLines: 6 },
  forecast: { forecastCount: 8, approvedCount: 3 },
  consignment: { totalQty: 85, customerCount: 3, productCount: 5 },
  wms: { skuCount: 120, totalQty: 9000, lowStockSkus: 4 },
  fulfillment: { pipeline: [{ stage: 'SO Candidate', count: 12, status: 'ready', owner: 'Sales' }] },
};

beforeEach(() => {
  vi.clearAllMocks();
  executiveDashboardService.getExecutiveDashboardData.mockResolvedValue(executiveSeed);
  executiveDashboardService.isSupabaseConfigured.mockReturnValue(true);
  skuAdminService.listSkuAdminProducts.mockResolvedValue({
    rows: [{
      id: '1',
      productCode: '10001',
      productName: 'Test Product',
      productGroup: 'Sausage',
      uom: 'KG',
      plantCode: 'TGM1',
      activeStatus: 'active',
      minStock: 50,
      shelfLifeDays: 30,
      leadTimeDays: 7,
      moq: 0,
      forecastClass: 'standard',
    }],
    groups: ['Sausage'],
    summary: { skuCount: 1, activeCount: 1, groupCount: 1, lowMinStockCount: 0 },
    source: 'seed',
  });
  skuAdminService.listSkuSettingRequests.mockResolvedValue([]);
  skuAdminService.isSupabaseConfigured.mockReturnValue(true);
  adminReportsService.listReportDefinitions.mockReturnValue([
    { id: 'sales', title: 'Sales Report', description: 'Sales', category: 'Sales', path: '/executive/sales-overview' },
  ]);
  adminReportsService.getReportPreview.mockResolvedValue({
    rows: [{ productCode: '10001', orderedQty: 10 }],
    columns: [{ key: 'productCode', label: 'SKU' }, { key: 'orderedQty', label: 'Ordered Qty' }],
  });
  adminReportsService.isSupabaseConfigured.mockReturnValue(true);
});

afterEach(() => cleanup());

describe('Final legacy completion — Executive Dashboard (pgDash)', () => {
  it('renders executive KPI sections', async () => {
    render(
      <MemoryRouter>
        <ManagementDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Executive Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'System Sync' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Sales' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Forecast, CONSI & WMS' })).toBeInTheDocument();
  });

  it('executiveDashboardService has no Express write-back', () => {
    expect(serviceSources.executive).not.toMatch(/service_role|dbf/i);
    expect(serviceSources.executive).toMatch(/getExpressSyncStatus/);
  });
});

describe('Final legacy completion — SKU Admin (pgSKUAdmin)', () => {
  it('renders SKU master table and request form', async () => {
    render(<SKUSettingsPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /SKU Settings/i })).toBeInTheDocument();
    expect(await screen.findByText('10001')).toBeInTheDocument();
    expect(screen.getByText(/Submit Setting Request/i)).toBeInTheDocument();
  });

  it('skuAdminService uses blocked_by_governance requests', () => {
    expect(serviceSources.skuAdmin).toMatch(/sc_sku_setting_requests/);
    expect(serviceSources.skuAdmin).toMatch(/blocked_by_governance/);
    expect(serviceSources.skuAdmin).not.toMatch(/service_role|stmas/i);
  });
});

describe('Final legacy completion — Admin Reports (pgReports)', () => {
  it('renders report center with preview table', async () => {
    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Reports & Export/i })).toBeInTheDocument();
    expect(await screen.findByText('Sales Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV \(Safe\)/i })).toBeInTheDocument();
  });

  it('adminReportsService is read-only export', () => {
    expect(serviceSources.adminReports).toMatch(/exportReportCsv/);
    expect(serviceSources.adminReports).not.toMatch(/service_role|dbf/i);
  });
});
