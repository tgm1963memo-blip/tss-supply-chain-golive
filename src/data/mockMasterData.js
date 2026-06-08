export const mockProducts = [
  {
    id: 'PRD-001',
    sku: 'SKU-FZ-001',
    productName: 'Frozen Chicken Breast 1kg',
    category: 'Frozen Poultry',
    uom: 'KG',
    status: 'Active',
    barcode: '8850123456001',
  },
  {
    id: 'PRD-002',
    sku: 'SKU-FZ-002',
    productName: 'Frozen Shrimp 500g',
    category: 'Frozen Seafood',
    uom: 'CTN',
    status: 'Active',
    barcode: '8850123456002',
  },
  {
    id: 'PRD-003',
    sku: 'SKU-DR-010',
    productName: 'Dry Spice Mix 250g',
    category: 'Dry Goods',
    uom: 'PCS',
    status: 'Active',
    barcode: '8850123456010',
  },
];

export const mockCustomers = [
  {
    id: 'CUST-001',
    customerCode: 'ABC-001',
    customerName: 'ABC Retail Co.',
    channel: 'Modern Trade',
    region: 'Bangkok',
    creditTerm: '30 days',
    status: 'Active',
  },
  {
    id: 'CUST-002',
    customerCode: 'FM-002',
    customerName: 'Fresh Mart Ltd.',
    channel: 'Retail',
    region: 'Central',
    creditTerm: '15 days',
    status: 'Active',
  },
];

export const mockBranches = [
  {
    id: 'BR-001',
    branchCode: 'BR-CHI-01',
    branchName: 'Chiang Mai Branch',
    region: 'North',
    type: 'Consignment',
    status: 'Active',
  },
  {
    id: 'BR-002',
    branchCode: 'BR-PKT-01',
    branchName: 'Phuket Branch',
    region: 'South',
    type: 'Consignment',
    status: 'Active',
  },
];

export const mockWarehouses = [
  {
    id: 'WH-001',
    warehouseCode: 'WH-BKK-01',
    warehouseName: 'Bangkok Main DC',
    type: 'Cold Storage',
    capacity: '5,000 pallets',
    status: 'Active',
  },
  {
    id: 'WH-002',
    warehouseCode: 'WH-CNX-01',
    warehouseName: 'Chiang Mai DC',
    type: 'Dry Storage',
    capacity: '1,200 pallets',
    status: 'Active',
  },
];

export const productColumns = [
  { key: 'sku', label: 'SKU' },
  { key: 'productName', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'uom', label: 'UOM' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'status', label: 'Status' },
];

export const customerColumns = [
  { key: 'customerCode', label: 'Customer Code' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'channel', label: 'Channel' },
  { key: 'region', label: 'Region' },
  { key: 'creditTerm', label: 'Credit Term' },
  { key: 'status', label: 'Status' },
];

export const masterSummaryCards = [
  { label: 'Active Products', value: '1,248', hint: 'SKU master records' },
  { label: 'Active Customers', value: '186', hint: 'Trading partners' },
  { label: 'Warehouses', value: '6', hint: 'DC and cold storage' },
  { label: 'Branches', value: '18', hint: 'Consignment locations' },
];

export const branchColumns = [
  { key: 'branchCode', label: 'Branch Code' },
  { key: 'branchName', label: 'Branch Name' },
  { key: 'region', label: 'Region' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
];

export const warehouseColumns = [
  { key: 'warehouseCode', label: 'Warehouse Code' },
  { key: 'warehouseName', label: 'Warehouse Name' },
  { key: 'type', label: 'Type' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status' },
];

export default {
  products: mockProducts,
  customers: mockCustomers,
  branches: mockBranches,
  warehouses: mockWarehouses,
};
