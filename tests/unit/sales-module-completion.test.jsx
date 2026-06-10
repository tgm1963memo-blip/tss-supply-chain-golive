/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SalesForecastPage from '../../src/features/sales/SalesForecastPage.jsx';
import CustomerMapPage from '../../src/features/sales/CustomerMapPage.jsx';
import ReturnCNPage from '../../src/features/sales/ReturnCNPage.jsx';
import SampleConsumablePage from '../../src/features/sales/SampleConsumablePage.jsx';
import SalesOrderListPage from '../../src/features/sales/SalesOrderListPage.jsx';
import * as salesForecastService from '../../src/services/sales/salesForecastService.js';
import * as customerMapService from '../../src/services/customerMap/customerMapService.js';
import * as returnCnService from '../../src/services/sales/returnCnService.js';
import * as sampleService from '../../src/services/sales/sampleConsumableService.js';
import * as reservationService from '../../src/services/sales/reservationSourceService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/sales/salesForecastService.js');
vi.mock('../../src/services/customerMap/customerMapService.js');
vi.mock('../../src/services/sales/returnCnService.js');
vi.mock('../../src/services/sales/sampleConsumableService.js');
vi.mock('../../src/services/sales/reservationSourceService.js');

const serviceSources = {
  forecast: readFileSync(join(testDir, '../../src/services/sales/salesForecastService.js'), 'utf8'),
  returnCn: readFileSync(join(testDir, '../../src/services/sales/returnCnService.js'), 'utf8'),
  sample: readFileSync(join(testDir, '../../src/services/sales/sampleConsumableService.js'), 'utf8'),
};

describe('Sales module completion — Sales Forecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    salesForecastService.listForecasts.mockResolvedValue([]);
    salesForecastService.replaceForecastsForMonth.mockResolvedValue(1);
    salesForecastService.copyForecastsFromMonth.mockResolvedValue(0);
    salesForecastService.mergeForecastsForMonth.mockResolvedValue(1);
  });

  afterEach(() => cleanup());

  it('renders legacy tabs and SAFE MODE banner', async () => {
    render(<SalesForecastPage />);
    expect(await screen.findByText(/Sales Forecast/i)).toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
    expect(screen.getByText(/ตารางแผน/)).toBeInTheDocument();
    expect(screen.getByText(/สรุปรับของ/)).toBeInTheDocument();
  });

  it('service has no Express write-back', () => {
    expect(serviceSources.forecast).not.toMatch(/service_role/i);
    expect(serviceSources.forecast).toMatch(/sc_sales_forecasts/);
  });
});

describe('Sales module completion — Customer Map', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerMapService.isSupabaseConfigured.mockReturnValue(true);
    customerMapService.getCustomerMapSalesSummary.mockResolvedValue({
      summary: { totalSales: 1000, customerCount: 2, orderCount: 3, totalQty: 50 },
      rows: [{ id: '1', customerCode: 'C001', customerName: 'Test Co', qty: 10, amount: 500 }],
      byCustomerGroup: [{ label: 'Retail', value: 500 }],
      customerTotals: [{ customerCode: 'C001', customerName: 'Test Co', totalQty: 10, totalAmount: 500, orderCount: 1 }],
    });
  });

  afterEach(() => cleanup());

  it('renders customer sales summary without map placeholder', async () => {
    render(<CustomerMapPage />);
    expect(await screen.findByText(/Customer Map/i)).toBeInTheDocument();
    expect(screen.queryByText(/Map Placeholder/i)).not.toBeInTheDocument();
    expect(await screen.findByText('Test Co')).toBeInTheDocument();
  });
});

describe('Sales module completion — Return / CN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returnCnService.listReturnCnRequests.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it('renders request list with governance banner', async () => {
    render(<ReturnCNPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /คืนสินค้า-ใบลดหนี้/i })).toBeInTheDocument();
    expect(screen.getByText(/blocked_by_governance/i)).toBeInTheDocument();
    expect(screen.getByText('+ New Request')).toBeInTheDocument();
  });

  it('opens form with line grid', async () => {
    render(<ReturnCNPage />);
    fireEvent.click(await screen.findByText('+ New Request'));
    expect(await screen.findByText(/Return \/ CN Lines/i)).toBeInTheDocument();
    expect(screen.getByText(/Stock impact flag/i)).toBeInTheDocument();
  });

  it('service blocks Express queue', () => {
    expect(serviceSources.returnCn).toMatch(/blocked_by_governance/);
    expect(serviceSources.returnCn).not.toMatch(/service_role/i);
  });
});

describe('Sales module completion — Sample & Consumable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sampleService.listSampleRequests.mockResolvedValue([]);
    sampleService.SAMPLE_UNITS = ['กก.', 'ถุง'];
  });

  afterEach(() => cleanup());

  it('renders KPI list view from legacy pgSample', async () => {
    render(<SampleConsumablePage />);
    expect(await screen.findByRole('heading', { name: /Sample & Consumable/i })).toBeInTheDocument();
    expect(screen.getAllByText('Pending Approval').length).toBeGreaterThan(0);
    expect(screen.getByText('+ New Request')).toBeInTheDocument();
  });

  it('opens form with purpose and items', async () => {
    render(<SampleConsumablePage />);
    fireEvent.click(await screen.findByText('+ New Request'));
    expect(await screen.findByLabelText(/Purpose/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample Items/i)).toBeInTheDocument();
  });

  it('service has no stock deduction to Express', () => {
    expect(serviceSources.sample).toMatch(/sc_sample_consumable/);
    expect(serviceSources.sample).not.toMatch(/service_role/i);
  });
});

describe('Sales module completion — Sales Order list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reservationService.isSupabaseConfigured.mockReturnValue(true);
    reservationService.listSalesOrderReservationCandidates.mockResolvedValue([
      { documentNo: 'SO-001', customerCode: 'C001', productCode: 'SKU1', reservedQty: 0 },
    ]);
  });

  afterEach(() => cleanup());

  it('renders sales order list with real table', async () => {
    render(
      <MemoryRouter>
        <SalesOrderListPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Sales Orders/i })).toBeInTheDocument();
    expect(await screen.findByText('SO-001')).toBeInTheDocument();
  });
});
