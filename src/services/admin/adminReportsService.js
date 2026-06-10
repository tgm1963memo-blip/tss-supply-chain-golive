import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { getExpressSyncStatus } from '../system/expressSyncStatusService.js';
import { getSalesDashboardMetrics } from '../sales/dashboardService.js';
import { listForecasts } from '../sales/salesForecastService.js';
import { getConsignmentDashboardData } from '../consignment/consignmentService.js';
import { getWmsDashboardData } from '../warehouse/wmsDashboardService.js';
import {
  getInventoryDashboardMetrics,
  getShortageOverviewMetrics,
} from '../executive/executiveDashboardService.js';

export { isSupabaseConfigured };

export const REPORT_DEFINITIONS = [
  {
    id: 'sales',
    title: 'Sales Report',
    description: 'SO lines, reservation candidates, top customers/products.',
    category: 'Sales',
    path: '/executive/sales-overview',
  },
  {
    id: 'stock',
    title: 'Stock Balance Report',
    description: 'On-hand, reserved, available from Express sync.',
    category: 'Inventory',
    path: '/executive/stock-overview',
  },
  {
    id: 'planning',
    title: 'Planning / Shortage Report',
    description: 'Demand planning shortage and pick readiness.',
    category: 'Planning',
    path: '/planning/shortage-review',
  },
  {
    id: 'forecast',
    title: 'Sales Forecast Report',
    description: 'Forecast entries from sc_sales_forecasts.',
    category: 'Sales',
    path: '/sales/forecast',
  },
  {
    id: 'consignment',
    title: 'Consignment Report',
    description: 'CONSI branch sales summary and branch stock.',
    category: 'Consignment',
    path: '/consignment',
  },
  {
    id: 'warehouse',
    title: 'Warehouse / WMS Report',
    description: 'WMS stock dashboard and movement visibility.',
    category: 'Warehouse',
    path: '/warehouse/wms',
  },
  {
    id: 'sync',
    title: 'Sync / Audit Report',
    description: 'Express sync jobs, row counts, failed records.',
    category: 'System',
    path: '/admin/sync-status',
  },
];

function rowsToCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const body = rows.map((row) => columns.map((c) => {
    const val = row[c.key];
    const text = val == null ? '' : String(val);
    return `"${text.replace(/"/g, '""')}"`;
  }).join(','));
  return [header, ...body].join('\n');
}

export async function getReportPreview(reportId, filters = {}) {
  const limit = filters.limit || 50;

  switch (reportId) {
    case 'sales': {
      const sales = await getSalesDashboardMetrics();
      return {
        summary: sales,
        rows: (sales?.topProducts || []).map(([code, qty]) => ({
          productCode: code,
          orderedQty: qty,
        })),
        columns: [
          { key: 'productCode', label: 'SKU' },
          { key: 'orderedQty', label: 'Ordered Qty' },
        ],
      };
    }
    case 'stock': {
      const stock = await getInventoryDashboardMetrics();
      const rows = [...(stock?.lowStockList || []), ...(stock?.topReserved || [])].slice(0, limit);
      return {
        summary: stock,
        rows,
        columns: [
          { key: 'productCode', label: 'SKU' },
          { key: 'warehouseCode', label: 'Warehouse' },
          { key: 'availableQty', label: 'Available' },
          { key: 'reservedQty', label: 'Reserved' },
        ],
      };
    }
    case 'planning': {
      const shortage = await getShortageOverviewMetrics();
      return {
        summary: shortage.summary,
        rows: (shortage.topShortages || []).slice(0, limit),
        columns: [
          { key: 'product_code', label: 'SKU' },
          { key: 'shortage_qty', label: 'Shortage Qty' },
          { key: 'demand_qty', label: 'Demand Qty' },
        ],
      };
    }
    case 'forecast': {
      const rows = (await listForecasts()).slice(0, limit);
      return {
        summary: { count: rows.length },
        rows,
        columns: [
          { key: 'sku', label: 'SKU' },
          { key: 'qty', label: 'Qty' },
          { key: 'delivDate', label: 'Delivery Date' },
          { key: 'approved', label: 'Approved' },
        ],
      };
    }
    case 'consignment': {
      const data = await getConsignmentDashboardData({});
      return {
        summary: data.summary,
        rows: (data.rows || []).slice(0, limit),
        columns: [
          { key: 'customerName', label: 'Customer' },
          { key: 'productCode', label: 'SKU' },
          { key: 'qty', label: 'Qty' },
          { key: 'amount', label: 'Amount' },
        ],
      };
    }
    case 'warehouse': {
      const wms = await getWmsDashboardData();
      return {
        summary: wms.summary,
        rows: (wms.rows || []).slice(0, limit),
        columns: [
          { key: 'productCode', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'qty', label: 'Qty' },
        ],
      };
    }
    case 'sync': {
      const sync = await getExpressSyncStatus();
      const rows = [
        { metric: 'Products synced', value: sync.productsSynced },
        { metric: 'Customers synced', value: sync.customersSynced },
        { metric: 'Stock rows synced', value: sync.stockRowsSynced },
        { metric: 'SO headers synced', value: sync.soHeadersSynced },
        { metric: 'SO lines synced', value: sync.soLinesSynced },
        { metric: 'Failed records', value: sync.failedRecords },
      ];
      return {
        summary: sync,
        rows,
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
      };
    }
    default:
      return { summary: {}, rows: [], columns: [] };
  }
}

export async function exportReportCsv(reportId, filters = {}) {
  const preview = await getReportPreview(reportId, filters);
  if (!preview.rows?.length) {
    return { filename: `${reportId}-report-empty.csv`, content: 'No data' };
  }
  return {
    filename: `${reportId}-report.csv`,
    content: rowsToCsv(preview.rows, preview.columns),
  };
}

export function listReportDefinitions(category = '') {
  if (!category) return REPORT_DEFINITIONS;
  return REPORT_DEFINITIONS.filter((r) => r.category === category);
}
