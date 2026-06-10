/** Legacy pgConsignment / CONSI constants from tgm-supplychain index.html */

export const CONSI_COMPANY = 'CONSI';

export const CONSI_CUST_GROUP = 'ฝากขาย';

export const CONSI_QUICK_LINKS = [
  { path: '/consignment/so', label: 'Consignment SO', icon: '📋' },
  { path: '/consignment/branch-stock', label: 'Branch Stock', icon: '🏪' },
  { path: '/consignment/movement', label: 'Movement / Temp DN', icon: '🔄' },
  { path: '/consignment/sell-out', label: 'Sell-out Record', icon: '📉' },
  { path: '/consignment/return-from-branch', label: 'Return from Branch', icon: '↩️' },
  { path: '/consignment/return-cn', label: 'CONSI Return / CN', icon: '🧾' },
];

export function isConsiBranch(branch) {
  return String(branch || '').toUpperCase().startsWith('CONSI');
}

export function defaultMonthRange() {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  return { start, end };
}
