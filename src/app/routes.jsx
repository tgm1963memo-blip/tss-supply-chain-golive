import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';

import DashboardPage from '../features/dashboard/DashboardPage.jsx';

import SalesOrderListPage from '../features/sales/SalesOrderListPage.jsx';
import SalesOrderDetailPage from '../features/sales/SalesOrderDetailPage.jsx';
import ReservationWorkbenchPage from '../features/sales/ReservationWorkbenchPage.jsx';
import ShortageAlertPage from '../features/sales/ShortageAlertPage.jsx';
import ReturnCNPage from '../features/sales/ReturnCNPage.jsx';

import SalesForecastPage from '../features/planning/SalesForecastPage.jsx';
import StockPlanningPage from '../features/planning/StockPlanningPage.jsx';
import ATPWorkbenchPage from '../features/planning/ATPWorkbenchPage.jsx';
import DemandPlanPage from '../features/planning/DemandPlanPage.jsx';

import StockBalancePage from '../features/inventory/StockBalancePage.jsx';
import StockMovementPage from '../features/inventory/StockMovementPage.jsx';
import InventoryLedgerPage from '../features/inventory/InventoryLedgerPage.jsx';

import WMSDashboardPage from '../features/wms/WMSDashboardPage.jsx';
import ReceivingPage from '../features/wms/ReceivingPage.jsx';
import PutawayPage from '../features/wms/PutawayPage.jsx';
import TransferPage from '../features/wms/TransferPage.jsx';
import PickingPage from '../features/wms/PickingPage.jsx';
import DispatchPage from '../features/wms/DispatchPage.jsx';
import StockCountPage from '../features/wms/StockCountPage.jsx';
import StockAdjustmentPage from '../features/wms/StockAdjustmentPage.jsx';
import BarcodeScanPage from '../features/wms/BarcodeScanPage.jsx';

import ConsignmentDashboardPage from '../features/consignment/ConsignmentDashboardPage.jsx';
import BranchStockPage from '../features/consignment/BranchStockPage.jsx';
import ConsignmentSOPage from '../features/consignment/ConsignmentSOPage.jsx';
import ConsignmentMovementPage from '../features/consignment/ConsignmentMovementPage.jsx';
import ConsignmentReturnCNPage from '../features/consignment/ConsignmentReturnCNPage.jsx';

import SampleRequestPage from '../features/sample-consumable/SampleRequestPage.jsx';
import ConsumableRequestPage from '../features/sample-consumable/ConsumableRequestPage.jsx';
import ApprovalPage from '../features/sample-consumable/ApprovalPage.jsx';
import IssueConfirmPage from '../features/sample-consumable/IssueConfirmPage.jsx';
import UsageReportPage from '../features/sample-consumable/UsageReportPage.jsx';

import ProductMasterPage from '../features/master-data/ProductMasterPage.jsx';
import CustomerMasterPage from '../features/master-data/CustomerMasterPage.jsx';
import BranchMasterPage from '../features/master-data/BranchMasterPage.jsx';
import WarehouseMasterPage from '../features/master-data/WarehouseMasterPage.jsx';
import LocationMasterPage from '../features/master-data/LocationMasterPage.jsx';
import UOMConversionPage from '../features/master-data/UOMConversionPage.jsx';
import SKUAliasPage from '../features/master-data/SKUAliasPage.jsx';

import SalesStockReportPage from '../features/reports/SalesStockReportPage.jsx';
import ShortageReportPage from '../features/reports/ShortageReportPage.jsx';
import ConsignmentReportPage from '../features/reports/ConsignmentReportPage.jsx';
import SampleUsageReportPage from '../features/reports/SampleUsageReportPage.jsx';

import UserPage from '../features/admin/UserPage.jsx';
import RolePermissionPage from '../features/admin/RolePermissionPage.jsx';
import AuditLogPage from '../features/admin/AuditLogPage.jsx';
import SyncMonitorPage from '../features/admin/SyncMonitorPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route path="sales">
          <Route path="orders" element={<SalesOrderListPage />} />
          <Route path="orders/:orderId" element={<SalesOrderDetailPage />} />
          <Route path="reservation" element={<ReservationWorkbenchPage />} />
          <Route path="shortage" element={<ShortageAlertPage />} />
          <Route path="return-cn" element={<ReturnCNPage />} />
        </Route>

        <Route path="planning">
          <Route path="forecast" element={<SalesForecastPage />} />
          <Route path="stock" element={<StockPlanningPage />} />
          <Route path="atp" element={<ATPWorkbenchPage />} />
          <Route path="demand" element={<DemandPlanPage />} />
        </Route>

        <Route path="inventory">
          <Route path="balance" element={<StockBalancePage />} />
          <Route path="movement" element={<StockMovementPage />} />
          <Route path="ledger" element={<InventoryLedgerPage />} />
        </Route>

        <Route path="wms">
          <Route index element={<WMSDashboardPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          <Route path="putaway" element={<PutawayPage />} />
          <Route path="transfer" element={<TransferPage />} />
          <Route path="picking" element={<PickingPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="stock-count" element={<StockCountPage />} />
          <Route path="adjustment" element={<StockAdjustmentPage />} />
          <Route path="barcode" element={<BarcodeScanPage />} />
        </Route>

        <Route path="consignment">
          <Route index element={<ConsignmentDashboardPage />} />
          <Route path="branch-stock" element={<BranchStockPage />} />
          <Route path="so" element={<ConsignmentSOPage />} />
          <Route path="movement" element={<ConsignmentMovementPage />} />
          <Route path="return-cn" element={<ConsignmentReturnCNPage />} />
        </Route>

        <Route path="sample-consumable">
          <Route path="sample" element={<SampleRequestPage />} />
          <Route path="consumable" element={<ConsumableRequestPage />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="issue" element={<IssueConfirmPage />} />
          <Route path="usage" element={<UsageReportPage />} />
        </Route>

        <Route path="master-data">
          <Route path="products" element={<ProductMasterPage />} />
          <Route path="customers" element={<CustomerMasterPage />} />
          <Route path="branches" element={<BranchMasterPage />} />
          <Route path="warehouses" element={<WarehouseMasterPage />} />
          <Route path="locations" element={<LocationMasterPage />} />
          <Route path="uom" element={<UOMConversionPage />} />
          <Route path="sku-alias" element={<SKUAliasPage />} />
        </Route>

        <Route path="reports">
          <Route path="sales-stock" element={<SalesStockReportPage />} />
          <Route path="shortage" element={<ShortageReportPage />} />
          <Route path="consignment" element={<ConsignmentReportPage />} />
          <Route path="sample-usage" element={<SampleUsageReportPage />} />
        </Route>

        <Route path="admin">
          <Route path="users" element={<UserPage />} />
          <Route path="roles" element={<RolePermissionPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="sync" element={<SyncMonitorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
