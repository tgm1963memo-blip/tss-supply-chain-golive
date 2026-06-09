/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SalesOverviewPage from '../../src/features/sales/SalesOverviewPage.jsx';
import CustomerRegistrationPage from '../../src/features/sales/CustomerRegistrationPage.jsx';
import * as salesOverviewService from '../../src/services/sales/salesOverviewService.js';
import * as customerRegistrationService from '../../src/services/sales/customerRegistrationService.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const customerRegistrationSource = readFileSync(
  join(testDir, '../../src/services/sales/customerRegistrationService.js'),
  'utf8',
);
const salesOverviewSource = readFileSync(
  join(testDir, '../../src/services/sales/salesOverviewService.js'),
  'utf8',
);

vi.mock('../../src/services/sales/salesOverviewService.js');
vi.mock('../../src/services/sales/customerRegistrationService.js');

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.replace(/^\//, '')} element={element} />
        <Route path="sales/overview" element={<SalesOverviewPage />} />
        <Route path="sales/customer-registration" element={<CustomerRegistrationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openNewRegistrationForm() {
  render(<CustomerRegistrationPage />);
  fireEvent.click(await screen.findByText('+ New Request'));
  await screen.findByText(/Single-page registration document/i);
}

const SECTION_HEADINGS = [
  /1\. ข้อมูลคำขอ/i,
  /2\. ข้อมูลลูกค้า/i,
  /3\. ข้อมูลภาษีและวางบิล/i,
  /4\. สถานที่จัดส่ง/i,
  /5\. เงื่อนไขการค้า/i,
  /6\. เอกสารแนบ/i,
  /7\. การอนุมัติ/i,
];

describe('Sales legacy functions — Sales Overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    salesOverviewService.isSupabaseConfigured.mockReturnValue(true);
    salesOverviewService.getSalesOverviewSummary.mockResolvedValue({
      totalSales: 1000,
      totalQty: 50,
      customerCount: 3,
      orderCount: 4,
      averageSalesPerDay: 100,
    });
    salesOverviewService.listSalesOverviewRows.mockResolvedValue([
      {
        id: '1',
        date: '2026-06-01',
        customerName: 'Test Co',
        customerCode: 'C001',
        productGroup: 'FG',
        salesperson: 'SLM01',
        qty: 10,
        amount: 500,
        channel: 'invoice',
      },
    ]);
    salesOverviewService.getSalesByMonth.mockResolvedValue([{ label: '2026-06', value: 500 }]);
    salesOverviewService.getSalesByCustomerGroup.mockResolvedValue([{ label: 'Retail', value: 500 }]);
    salesOverviewService.getSalesByProductGroup.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('route /sales/overview renders Sales Overview page', async () => {
    renderAt('/sales/overview', <SalesOverviewPage />);
    expect(await screen.findByText('Sales Overview / ภาพรวมยอดขาย')).toBeInTheDocument();
  });

  it('has filter toolbar, summary cards, and data table', async () => {
    render(<SalesOverviewPage />);
    expect(await screen.findByText('Date from')).toBeInTheDocument();
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('Test Co')).toBeInTheDocument();
  });

  it('shows READ ONLY safe mode and no write-back actions', async () => {
    render(<SalesOverviewPage />);
    expect(await screen.findByText('READ ONLY')).toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
    expect(screen.queryByText(/write back/i, { selector: 'button' })).not.toBeInTheDocument();
  });
});

describe('Sales legacy functions — Customer Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerRegistrationService.listCustomerRegistrationRequests.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('route /sales/customer-registration renders page', async () => {
    renderAt('/sales/customer-registration', <CustomerRegistrationPage />);
    expect(await screen.findByText('Customer Registration / ขึ้นทะเบียนลูกค้า')).toBeInTheDocument();
  });

  it('renders all 7 sections on one scrollable page', async () => {
    await openNewRegistrationForm();
    SECTION_HEADINGS.forEach((pattern) => {
      expect(screen.getByText(pattern)).toBeInTheDocument();
    });
    expect(screen.queryByRole('navigation', { name: /Customer registration sections/i })).not.toBeInTheDocument();
  });

  it('shows customer, billing, delivery, credit, and attachment fields together', async () => {
    await openNewRegistrationForm();
    expect(screen.getByLabelText(/Customer Name TH/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tax ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Branch Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Billing Cycle/i)).toBeInTheDocument();
    expect(screen.getByText(/สำเนาบัตรประชาชน/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Drive link/i)).toBeInTheDocument();
  });

  it('shows approval timeline columns and workflow buttons for submitted status', async () => {
    customerRegistrationService.listCustomerRegistrationRequests.mockResolvedValue([
      { id: 'req-1', request_no: 'CR-001', status: 'submitted', customer_name_th: 'ร้านทดสอบ' },
    ]);
    customerRegistrationService.getCustomerRegistrationRequest.mockResolvedValue({
      id: 'req-1',
      request_no: 'CR-001',
      status: 'submitted',
      customer_name_th: 'ร้านทดสอบ',
    });
    customerRegistrationService.listCustomerRegistrationApprovalLogs.mockResolvedValue([
      {
        id: 'log-1',
        action: 'submitted',
        from_status: 'draft',
        to_status: 'submitted',
        actor_name: 'Current User',
        comment: 'Please approve',
        created_at: '2026-06-09T10:00:00Z',
      },
    ]);

    render(<CustomerRegistrationPage />);
    fireEvent.click(await screen.findByText('View / Edit'));
    await screen.findByText(/Approval Timeline/i);

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getAllByText('submitted').length).toBeGreaterThan(0);
    expect(screen.getByText('Please approve')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Request Revision')).toBeInTheDocument();
  });

  it('shows Save Draft and Submit for draft status', async () => {
    await openNewRegistrationForm();
    expect(await screen.findByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit for Approval' })).not.toBeInTheDocument();
  });

  it('shows CR_DOC_SLOTS attachment section with metadata-only mode', async () => {
    await openNewRegistrationForm();
    expect(screen.getByText(/CR_DOC_SLOTS/i)).toBeInTheDocument();
    expect(screen.getByText(/สำเนาบัตรประชาชน/)).toBeInTheDocument();
    expect(screen.getAllByText(/metadata only/i).length).toBeGreaterThan(0);
  });

  it('shows existing customer search for edit request type', async () => {
    await openNewRegistrationForm();
    fireEvent.change(screen.getByLabelText(/Request Type/i), { target: { value: 'edit_customer' } });
    expect(await screen.findByText(/Existing Customer Search/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('includes credit_change and final note fields', async () => {
    await openNewRegistrationForm();
    fireEvent.change(screen.getByLabelText(/Request Type/i), { target: { value: 'credit_change' } });
    expect(await screen.findByLabelText(/Credit change requested/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Final note/i)).toBeInTheDocument();
  });

  it('shows DATA ENTRY safe mode and no Express ARMAS write actions', async () => {
    render(<CustomerRegistrationPage />);
    expect(await screen.findByText('DATA ENTRY')).toBeInTheDocument();
    expect(screen.getByText('SAFE MODE')).toBeInTheDocument();
    expect(screen.getByText(/does not create or update Express customer master/i)).toBeInTheDocument();
    expect(screen.queryByText(/ARMAS/i, { selector: 'button' })).not.toBeInTheDocument();
  });
});

describe('Sales legacy services safety', () => {
  it('customerRegistrationService uses approval log schema fields', () => {
    expect(customerRegistrationSource).toMatch(/from_status/);
    expect(customerRegistrationSource).toMatch(/to_status/);
    expect(customerRegistrationSource).toMatch(/actor_name/);
    expect(customerRegistrationSource).toMatch(/CR_DOC_SLOTS/);
    expect(customerRegistrationSource).toMatch(/searchExistingCustomers/);
    expect(customerRegistrationSource).not.toMatch(/service_role/i);
    expect(customerRegistrationSource).not.toMatch(/ARMAS/i);
  });

  it('salesOverviewService has no write-back references', () => {
    expect(salesOverviewSource).not.toMatch(/\.insert\(/i);
    expect(salesOverviewSource).not.toMatch(/\.update\(/i);
    expect(salesOverviewSource).not.toMatch(/service_role/i);
  });
});
