import {
  getSalesByCustomerGroup,
  getSalesByMonth,
  getSalesByProductGroup,
  getSalesOverviewSummary,
  isSupabaseConfigured,
  listSalesOverviewRows,
} from '../sales/salesOverviewService.js';

export {
  getSalesByCustomerGroup,
  getSalesByMonth,
  getSalesByProductGroup,
  getSalesOverviewSummary,
  isSupabaseConfigured,
  listSalesOverviewRows,
};

/** Legacy pgCustMap delegates to pgMySales — customer-centric sales summary. */
export async function getCustomerMapSalesSummary(filters = {}) {
  const [summary, rows, byCustomer, byMonth, byProduct] = await Promise.all([
    getSalesOverviewSummary(filters),
    listSalesOverviewRows(filters),
    getSalesByCustomerGroup(filters),
    getSalesByMonth(filters),
    getSalesByProductGroup(filters),
  ]);

  const byCustomerCode = rows.reduce((acc, row) => {
    const code = row.customerCode || 'UNKNOWN';
    if (!acc[code]) {
      acc[code] = {
        customerCode: code,
        customerName: row.customerName || code,
        customerGroup: row.customerGroup || '',
        salesperson: row.salesperson || '',
        totalQty: 0,
        totalAmount: 0,
        orderCount: 0,
      };
    }
    acc[code].totalQty += Number(row.qty) || 0;
    acc[code].totalAmount += Number(row.amount) || 0;
    acc[code].orderCount += 1;
    return acc;
  }, {});

  return {
    summary,
    rows,
    byCustomerGroup: byCustomer,
    byMonth,
    byProductGroup: byProduct,
    customerTotals: Object.values(byCustomerCode).sort((a, b) => b.totalAmount - a.totalAmount),
  };
}
