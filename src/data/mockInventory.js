export const mockInventory = [
  {
    id: 'INV-001',
    sku: 'SKU-FZ-001',
    productName: 'Frozen Chicken Breast 1kg',
    warehouse: 'WH-BKK-01',
    location: 'A-01-01',
    onHand: 4500,
    reserved: 800,
    available: 3700,
    uom: 'KG',
    lotNo: 'LOT-2026-061',
  },
  {
    id: 'INV-002',
    sku: 'SKU-FZ-002',
    productName: 'Frozen Shrimp 500g',
    warehouse: 'WH-BKK-01',
    location: 'A-02-03',
    onHand: 1200,
    reserved: 500,
    available: 700,
    uom: 'CTN',
    lotNo: 'LOT-2026-058',
  },
  {
    id: 'INV-003',
    sku: 'SKU-DR-010',
    productName: 'Dry Spice Mix 250g',
    warehouse: 'WH-CNX-01',
    location: 'B-01-02',
    onHand: 8000,
    reserved: 200,
    available: 7800,
    uom: 'PCS',
    lotNo: 'LOT-2026-044',
  },
  {
    id: 'INV-004',
    sku: 'SKU-FZ-005',
    productName: 'Frozen Fish Fillet 800g',
    warehouse: 'WH-BKK-01',
    location: 'C-03-01',
    onHand: 320,
    reserved: 320,
    available: 0,
    uom: 'CTN',
    lotNo: 'LOT-2026-062',
  },
];

export const inventoryColumns = [
  { key: 'sku', label: 'SKU' },
  { key: 'productName', label: 'Product' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'location', label: 'Location' },
  { key: 'onHand', label: 'On Hand' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'available', label: 'Available' },
  { key: 'uom', label: 'UOM' },
  { key: 'lotNo', label: 'Lot No.' },
];

export const inventorySummaryCards = [
  { label: 'Total SKUs', value: '1,248', hint: 'Across all warehouses' },
  { label: 'On Hand Value', value: '฿12.4M', hint: 'Mock valuation' },
  { label: 'Reserved Qty', value: '18,400', hint: 'Linked to sales orders' },
  { label: 'Zero Stock SKUs', value: '14', hint: 'Requires replenishment' },
];

export default mockInventory;
