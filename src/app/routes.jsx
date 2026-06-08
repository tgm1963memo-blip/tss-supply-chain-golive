import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';

// Executive Dashboard
import ManagementDashboardPage from '../features/executive/ManagementDashboardPage.jsx';
import ExecutiveSalesOverviewPage from '../features/executive/SalesOverviewPage.jsx';
import StockOverviewPage from '../features/executive/StockOverviewPage.jsx';
import ShortageOverviewPage from '../features/executive/ShortageOverviewPage.jsx';
import OrderFulfillmentPage from '../features/executive/OrderFulfillmentPage.jsx';
import CONSIOverviewPage from '../features/executive/CONSIOverviewPage.jsx';

// Sales
import SalesOrderListPage from '../features/sales/SalesOrderListPage.jsx';
import SalesOrderDetailPage from '../features/sales/SalesOrderDetailPage.jsx';
import SalesForecastPage from '../features/sales/SalesForecastPage.jsx';
import SalesOverviewPage from '../features/sales/SalesOverviewPage.jsx';
import ReturnCNPage from '../features/sales/ReturnCNPage.jsx';
import CustomerRegistrationPage from '../features/sales/CustomerRegistrationPage.jsx';
import CustomerMapPage from '../features/sales/CustomerMapPage.jsx';
import SampleConsumablePage from '../features/sales/SampleConsumablePage.jsx';

// Planning & Allocation
import DemandPlanPage from '../features/planning/DemandPlanPage.jsx';
import StockPlanningPage from '../features/planning/StockPlanningPage.jsx';
import ATPWorkbenchPage from '../features/planning/ATPWorkbenchPage.jsx';
import ReservationWorkbenchPage from '../features/sales/ReservationWorkbenchPage.jsx';
import ShortageReviewPage from '../features/planning/ShortageReviewPage.jsx';
import ReservationSummaryPage from '../features/planning/ReservationSummaryPage.jsx';
import ProductionPurchaseSuggestionPage from '../features/planning/ProductionPurchaseSuggestionPage.jsx';

// Warehouse — Inventory Control
import StockBalancePage from '../features/inventory/StockBalancePage.jsx';
import AvailableStockPage from '../features/warehouse/inventory/AvailableStockPage.jsx';
import StockMovementPage from '../features/inventory/StockMovementPage.jsx';
import InventoryLedgerPage from '../features/inventory/InventoryLedgerPage.jsx';
import StockAdjustmentPage from '../features/wms/StockAdjustmentPage.jsx';
import StockCountPage from '../features/wms/StockCountPage.jsx';
import LotExpiryControlPage from '../features/warehouse/inventory/LotExpiryControlPage.jsx';

// Warehouse — WMS Operations
import WMSDashboardPage from '../features/wms/WMSDashboardPage.jsx';
import ReceivingPage from '../features/wms/ReceivingPage.jsx';
import PutawayPage from '../features/wms/PutawayPage.jsx';
import TransferPage from '../features/wms/TransferPage.jsx';
import PickingPackingPage from '../features/warehouse/wms/PickingPackingPage.jsx';
import DispatchGoodsIssuePage from '../features/warehouse/wms/DispatchGoodsIssuePage.jsx';
import ScanCenterPage from '../features/warehouse/wms/ScanCenterPage.jsx';
import HandheldOperationsPage from '../features/warehouse/wms/HandheldOperationsPage.jsx';

// Warehouse — Express Weight Write-back (SAFE MODE placeholders)
import WeightCapturePage from '../features/warehouse/express-weight/WeightCapturePage.jsx';
import WeightReviewPage from '../features/warehouse/express-weight/WeightReviewPage.jsx';
import ExpressWeightQueuePage from '../features/warehouse/express-weight/ExpressWeightQueuePage.jsx';
import ExpressWeightSyncLogPage from '../features/warehouse/express-weight/ExpressWeightSyncLogPage.jsx';
import WeightErrorRetryPage from '../features/warehouse/express-weight/WeightErrorRetryPage.jsx';

// Consignment / Modern Trade
import ConsignmentDashboardPage from '../features/consignment/ConsignmentDashboardPage.jsx';
import ConsignmentSOPage from '../features/consignment/ConsignmentSOPage.jsx';
import BranchStockPage from '../features/consignment/BranchStockPage.jsx';
import ConsignmentMovementPage from '../features/consignment/ConsignmentMovementPage.jsx';
import SellOutRecordPage from '../features/consignment/SellOutRecordPage.jsx';
import ReturnFromBranchPage from '../features/consignment/ReturnFromBranchPage.jsx';
import ConsignmentReturnCNPage from '../features/consignment/ConsignmentReturnCNPage.jsx';

// Master Data
import ProductMasterPage from '../features/master-data/ProductMasterPage.jsx';
import SKUSettingsPage from '../features/master-data/SKUSettingsPage.jsx';
import SKUAliasPage from '../features/master-data/SKUAliasPage.jsx';
import UOMConversionPage from '../features/master-data/UOMConversionPage.jsx';
import CustomerMasterPage from '../features/master-data/CustomerMasterPage.jsx';
import CustomerBranchPage from '../features/master-data/CustomerBranchPage.jsx';
import WarehouseMasterPage from '../features/master-data/WarehouseMasterPage.jsx';
import LocationMasterPage from '../features/master-data/LocationMasterPage.jsx';
import RoomCompanyPage from '../features/master-data/RoomCompanyPage.jsx';
import SystemControlPage from '../features/admin/SystemControlPage.jsx';

// Legacy mockup fallbacks (hidden from menu, reachable via redirect)
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import PickingPage from '../features/wms/PickingPage.jsx';
import DispatchPage from '../features/wms/DispatchPage.jsx';
import BarcodeScanPage from '../features/wms/BarcodeScanPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/executive/management" replace />} />

        {/* Executive Dashboard */}
        <Route path="executive">
          <Route path="management" element={<ManagementDashboardPage />} />
          <Route path="sales-overview" element={<ExecutiveSalesOverviewPage />} />
          <Route path="stock-overview" element={<StockOverviewPage />} />
          <Route path="shortage-overview" element={<ShortageOverviewPage />} />
          <Route path="order-fulfillment" element={<OrderFulfillmentPage />} />
          <Route path="consi-overview" element={<CONSIOverviewPage />} />
        </Route>

        {/* Sales */}
        <Route path="sales">
          <Route path="orders" element={<SalesOrderListPage />} />
          <Route path="orders/:orderId" element={<SalesOrderDetailPage />} />
          <Route path="forecast" element={<SalesForecastPage />} />
          <Route path="overview" element={<SalesOverviewPage />} />
          <Route path="return-cn" element={<ReturnCNPage />} />
          <Route path="customer-registration" element={<CustomerRegistrationPage />} />
          <Route path="customer-map" element={<CustomerMapPage />} />
          <Route path="sample-consumable" element={<SampleConsumablePage />} />
        </Route>

        {/* Planning & Allocation */}
        <Route path="planning">
          <Route path="demand" element={<DemandPlanPage />} />
          <Route path="stock" element={<StockPlanningPage />} />
          <Route path="atp" element={<ATPWorkbenchPage />} />
          <Route path="reservation" element={<ReservationWorkbenchPage />} />
          <Route path="shortage-review" element={<ShortageReviewPage />} />
          <Route path="reservation-summary" element={<ReservationSummaryPage />} />
          <Route path="production-purchase" element={<ProductionPurchaseSuggestionPage />} />
        </Route>

        {/* Warehouse — Inventory Control */}
        <Route path="warehouse/inventory">
          <Route path="balance" element={<StockBalancePage />} />
          <Route path="available" element={<AvailableStockPage />} />
          <Route path="movement" element={<StockMovementPage />} />
          <Route path="ledger" element={<InventoryLedgerPage />} />
          <Route path="adjustment" element={<StockAdjustmentPage />} />
          <Route path="cycle-count" element={<StockCountPage />} />
          <Route path="lot-expiry" element={<LotExpiryControlPage />} />
        </Route>

        {/* Warehouse — WMS Operations */}
        <Route path="warehouse/wms">
          <Route index element={<WMSDashboardPage />} />
          <Route path="receiving" element={<ReceivingPage />} />
          <Route path="putaway" element={<PutawayPage />} />
          <Route path="transfer" element={<TransferPage />} />
          <Route path="picking-packing" element={<PickingPackingPage />} />
          <Route path="dispatch-goods-issue" element={<DispatchGoodsIssuePage />} />
          <Route path="scan-center" element={<ScanCenterPage />} />
          <Route path="handheld" element={<HandheldOperationsPage />} />
        </Route>

        {/* Warehouse — Express Weight Write-back (SAFE MODE) */}
        <Route path="warehouse/express-weight">
          <Route path="capture" element={<WeightCapturePage />} />
          <Route path="review" element={<WeightReviewPage />} />
          <Route path="queue" element={<ExpressWeightQueuePage />} />
          <Route path="sync-log" element={<ExpressWeightSyncLogPage />} />
          <Route path="error-retry" element={<WeightErrorRetryPage />} />
        </Route>

        {/* Consignment / Modern Trade */}
        <Route path="consignment">
          <Route index element={<ConsignmentDashboardPage />} />
          <Route path="so" element={<ConsignmentSOPage />} />
          <Route path="branch-stock" element={<BranchStockPage />} />
          <Route path="movement" element={<ConsignmentMovementPage />} />
          <Route path="sell-out" element={<SellOutRecordPage />} />
          <Route path="return-from-branch" element={<ReturnFromBranchPage />} />
          <Route path="return-cn" element={<ConsignmentReturnCNPage />} />
        </Route>

        {/* Master Data */}
        <Route path="master-data">
          <Route path="products" element={<ProductMasterPage />} />
          <Route path="sku-settings" element={<SKUSettingsPage />} />
          <Route path="sku-alias" element={<SKUAliasPage />} />
          <Route path="uom" element={<UOMConversionPage />} />
          <Route path="customers" element={<CustomerMasterPage />} />
          <Route path="customer-branch" element={<CustomerBranchPage />} />
          <Route path="warehouses" element={<WarehouseMasterPage />} />
          <Route path="locations" element={<LocationMasterPage />} />
          <Route path="room-company" element={<RoomCompanyPage />} />
        </Route>

        {/* Legacy route redirects — keep mockup pages reachable */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inventory">
          <Route path="balance" element={<Navigate to="/warehouse/inventory/balance" replace />} />
          <Route path="movement" element={<Navigate to="/warehouse/inventory/movement" replace />} />
          <Route path="ledger" element={<Navigate to="/warehouse/inventory/ledger" replace />} />
        </Route>
        <Route path="wms">
          <Route index element={<Navigate to="/warehouse/wms" replace />} />
          <Route path="receiving" element={<Navigate to="/warehouse/wms/receiving" replace />} />
          <Route path="putaway" element={<Navigate to="/warehouse/wms/putaway" replace />} />
          <Route path="transfer" element={<Navigate to="/warehouse/wms/transfer" replace />} />
          <Route path="picking" element={<PickingPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="barcode" element={<BarcodeScanPage />} />
          <Route path="stock-count" element={<Navigate to="/warehouse/inventory/cycle-count" replace />} />
          <Route path="adjustment" element={<Navigate to="/warehouse/inventory/adjustment" replace />} />
        </Route>
        <Route path="sales/reservation" element={<Navigate to="/planning/reservation" replace />} />
        <Route path="sales/shortage" element={<Navigate to="/planning/shortage-review" replace />} />
        <Route path="planning/forecast" element={<Navigate to="/sales/forecast" replace />} />
        <Route path="master-data/branches" element={<Navigate to="/master-data/customer-branch" replace />} />
        <Route path="sample-consumable">
          <Route path="*" element={<Navigate to="/sales/sample-consumable" replace />} />
        </Route>
        <Route path="reports">
          <Route path="*" element={<Navigate to="/executive/management" replace />} />
        </Route>
        <Route path="admin">
          <Route path="system-control" element={<SystemControlPage />} />
          <Route path="*" element={<Navigate to="/admin/system-control" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/executive/management" replace />} />
      </Route>
    </Routes>
  );
}
