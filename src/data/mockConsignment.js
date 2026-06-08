export const mockConsignment = [
  {
    id: 'CSG-001',
    branchCode: 'BR-CHI-01',
    branchName: 'Chiang Mai Branch',
    sku: 'SKU-FZ-001',
    productName: 'Frozen Chicken Breast 1kg',
    onHand: 240,
    sold: 85,
    returnPending: 12,
    lastMovement: '2026-06-05',
    status: 'Active',
  },
  {
    id: 'CSG-002',
    branchCode: 'BR-PKT-01',
    branchName: 'Phuket Branch',
    sku: 'SKU-FZ-002',
    productName: 'Frozen Shrimp 500g',
    onHand: 180,
    sold: 42,
    returnPending: 0,
    lastMovement: '2026-06-06',
    status: 'Active',
  },
  {
    id: 'CSG-003',
    branchCode: 'BR-KKN-01',
    branchName: 'Khon Kaen Branch',
    sku: 'SKU-DR-010',
    productName: 'Dry Spice Mix 250g',
    onHand: 95,
    sold: 30,
    returnPending: 5,
    lastMovement: '2026-06-04',
    status: 'Low Stock',
  },
];

export const consignmentColumns = [
  { key: 'branchCode', label: 'Branch Code' },
  { key: 'branchName', label: 'Branch Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'productName', label: 'Product' },
  { key: 'onHand', label: 'On Hand' },
  { key: 'sold', label: 'Sold' },
  { key: 'returnPending', label: 'Return Pending' },
  { key: 'lastMovement', label: 'Last Movement' },
  { key: 'status', label: 'Status' },
];

export const consignmentSummaryCards = [
  { label: 'Active Branches', value: '18', hint: 'Consignment locations' },
  { label: 'Branch SKUs', value: '342', hint: 'Unique SKU per branch' },
  { label: 'Pending Returns', value: '27', hint: 'Awaiting CN processing' },
  { label: 'Low Stock Branches', value: '4', hint: 'Below reorder point' },
];

export default mockConsignment;
