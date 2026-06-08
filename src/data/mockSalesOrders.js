export const mockSalesOrders = [
  {
    id: 'SO-2026-001',
    orderNo: 'SO-2026-001',
    customer: 'ABC Retail Co.',
    orderDate: '2026-06-01',
    deliveryDate: '2026-06-10',
    status: 'Confirmed',
    totalQty: 1200,
    reservedQty: 800,
    shortageQty: 50,
    amount: '฿458,000',
  },
  {
    id: 'SO-2026-002',
    orderNo: 'SO-2026-002',
    customer: 'Fresh Mart Ltd.',
    orderDate: '2026-06-02',
    deliveryDate: '2026-06-12',
    status: 'Pending Reserve',
    totalQty: 800,
    reservedQty: 0,
    shortageQty: 120,
    amount: '฿312,500',
  },
  {
    id: 'SO-2026-003',
    orderNo: 'SO-2026-003',
    customer: 'Metro Foods',
    orderDate: '2026-06-03',
    deliveryDate: '2026-06-08',
    status: 'Partial Pick',
    totalQty: 500,
    reservedQty: 500,
    shortageQty: 0,
    amount: '฿189,750',
  },
  {
    id: 'SO-2026-004',
    orderNo: 'SO-2026-004',
    customer: 'City Wholesale',
    orderDate: '2026-06-04',
    deliveryDate: '2026-06-15',
    status: 'Draft',
    totalQty: 2000,
    reservedQty: 0,
    shortageQty: 0,
    amount: '฿920,000',
  },
];

export const salesOrderColumns = [
  { key: 'orderNo', label: 'Order No.' },
  { key: 'customer', label: 'Customer' },
  { key: 'orderDate', label: 'Order Date' },
  { key: 'deliveryDate', label: 'Delivery Date' },
  { key: 'status', label: 'Status' },
  { key: 'totalQty', label: 'Total Qty' },
  { key: 'reservedQty', label: 'Reserved' },
  { key: 'shortageQty', label: 'Shortage' },
  { key: 'amount', label: 'Amount' },
];

export const salesSummaryCards = [
  { label: 'Open Orders', value: '24', hint: 'Mock count — no live data' },
  { label: 'Pending Reserve', value: '8', hint: 'Awaiting reservation' },
  { label: 'Shortage Alerts', value: '3', hint: 'Items below ATP' },
  { label: 'Today Dispatch', value: '12', hint: 'Scheduled outbound' },
];

export default mockSalesOrders;
