/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ProductMasterPage from '../../src/features/master-data/ProductMasterPage.jsx';
import * as productMasterService from '../../src/services/master-data/productMasterService.js';

const testDir = dirname(fileURLToPath(import.meta.url));

vi.mock('../../src/services/master-data/productMasterService.js');

const serviceSources = {
  productMaster: readFileSync(
    join(testDir, '../../src/services/master-data/productMasterService.js'),
    'utf8',
  ),
  reservation: readFileSync(
    join(testDir, '../../src/services/sales/reservationSourceService.js'),
    'utf8',
  ),
  mapping: readFileSync(
    join(testDir, '../../scripts/express-readonly-sync/express_table_mapping.py'),
    'utf8',
  ),
};

const liveProductPayload = {
  source: 'live',
  groups: ['Sausage'],
  summary: {
    totalProducts: 3736,
    activeProducts: 3600,
    inactiveProducts: 136,
    productGroups: 1,
    groups: ['Sausage'],
  },
  rows: [{
    id: '1',
    productCode: '10001',
    productName: 'Live Product',
    productGroup: 'Sausage',
    uom: 'KG',
    barcode: '123',
    activeStatus: 'active',
    syncedAt: '2026-06-10T00:00:00Z',
  }],
};

beforeEach(() => {
  vi.clearAllMocks();
  productMasterService.listProductMasterRows.mockResolvedValue(liveProductPayload);
  productMasterService.isSupabaseConfigured.mockReturnValue(true);
});

afterEach(() => {
  cleanup();
});

describe('Gate Fix Round 1', () => {
  it('productMasterService reads sc_web_product_master_view with express fallback', () => {
    expect(serviceSources.productMaster).toMatch(/sc_web_product_master_view/);
    expect(serviceSources.productMaster).toMatch(/sc_web_sku_admin_view/);
  });

  it('ARTRN upsert conflict includes line_no in mapping', () => {
    expect(serviceSources.mapping).toMatch(/"sc_express_invoices": "room_code,document_no,line_no"/);
  });

  it('reservation service still references sc_so_reservation_candidate_view', () => {
    expect(serviceSources.reservation).toMatch(/sc_so_reservation_candidate_view/);
  });

  it('ProductMasterPage renders live KPIs from productMasterService', async () => {
    render(
      <MemoryRouter>
        <ProductMasterPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('3736')).toBeInTheDocument();
    expect(screen.getByText('Live Product')).toBeInTheDocument();
    expect(screen.queryByText(/Using seed data/i)).not.toBeInTheDocument();
  });
});
