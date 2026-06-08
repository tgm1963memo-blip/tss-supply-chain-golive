import { listSalesOrderReservationCandidates, isSupabaseConfigured } from './reservationSourceService.js';

export async function getSalesDashboardMetrics() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const candidates = await listSalesOrderReservationCandidates({ limit: 5000 });
  const openCount = candidates.filter((c) => !c.reservationExists).length;
  const reservedCount = candidates.filter(
    (c) => c.reservationExists && c.reservationStatus !== 'released',
  ).length;
  const releasedCount = candidates.filter(
    (c) => c.reservationExists && c.reservationStatus === 'released',
  ).length;

  const productCounts = candidates.reduce((acc, curr) => {
    acc[curr.productCode] = (acc[curr.productCode] || 0) + curr.orderedQty;
    return acc;
  }, {});

  const customerCounts = candidates.reduce((acc, curr) => {
    acc[curr.customerCode] = (acc[curr.customerCode] || 0) + curr.orderedQty;
    return acc;
  }, {});

  return {
    soCount: candidates.length,
    openCount,
    reservedCount,
    releasedCount,
    topProducts: Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
    topCustomers: Object.entries(customerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}
