import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { getSalesDashboardMetrics } from '../sales/dashboardService.js';
import { listStockBalances } from '../warehouse/stockBalanceService.js';
import {
  getDemandPlanningSummary,
  listDemandPlanningCandidates,
} from '../planning/demandPlanningService.js';
import { listReservations } from '../planning/reservationService.js';
import { listSalesOrderReservationCandidates } from '../sales/reservationSourceService.js';
import { listPickListCandidates } from '../picking/pickListCandidateService.js';
import { getPickingDocuments } from '../wms/pickingService.js';
import { getDispatchDocuments } from '../wms/dispatchService.js';

export { isSupabaseConfigured };

export async function getInventoryDashboardMetrics() {
  const balances = await listStockBalances({ limit: 5000 });

  const totalOnHand = balances.reduce((sum, b) => sum + b.erpOnHandQty, 0);
  const totalReserved = balances.reduce((sum, b) => sum + b.reservedQty, 0);
  const totalAvailable = balances.reduce((sum, b) => sum + b.availableQty, 0);

  const shortageList = balances.filter((b) => b.availableQty < 0).slice(0, 10);
  const lowStockList = balances.filter((b) => b.availableQty === 0).slice(0, 10);
  const topReserved = [...balances]
    .sort((a, b) => b.reservedQty - a.reservedQty)
    .filter((b) => b.reservedQty > 0)
    .slice(0, 10);

  return {
    totalOnHand,
    totalReserved,
    totalAvailable,
    shortageList,
    lowStockList,
    topReserved,
    locations: balances.length,
  };
}

export async function getFulfillmentPipelineMetrics() {
  const [
    candidates,
    reservations,
    pickCandidates,
    pickingResult,
    dispatchResult,
  ] = await Promise.all([
    listSalesOrderReservationCandidates({ limit: 5000 }),
    listReservations({ limit: 5000 }),
    listPickListCandidates({ limit: 5000 }),
    getPickingDocuments(),
    getDispatchDocuments(),
  ]);

  const pickingDocs = pickingResult?.data || [];
  const dispatchDocs = dispatchResult?.data || [];

  const openSoCount = candidates.filter((c) => !c.reservationExists).length;
  const activeReservationCount = reservations.filter((r) => r.status === 'active').length;
  const readyToPickCount = pickCandidates.filter((c) => c.pickReadiness === 'READY_TO_PICK').length;
  const pickDraftCount = pickCandidates.filter(
    (c) => c.pickingStatus === 'draft' || c.pickReadiness === 'PICK_DRAFT_EXISTS',
  ).length;

  const pipeline = [
    {
      stage: 'SO Candidate',
      count: candidates.length,
      status: 'ready',
      owner: 'Sales',
    },
    {
      stage: 'Open SO (Not Reserved)',
      count: openSoCount,
      status: openSoCount > 0 ? 'watch' : 'live',
      owner: 'Reservation',
    },
    {
      stage: 'Active Reservation',
      count: activeReservationCount,
      status: 'live',
      owner: 'Planning',
    },
    {
      stage: 'Pick Candidate',
      count: pickCandidates.length,
      status: 'ready',
      owner: 'Picking',
    },
    {
      stage: 'Ready to Pick',
      count: readyToPickCount,
      status: readyToPickCount > 0 ? 'ready' : 'draft',
      owner: 'Picking',
    },
    {
      stage: 'Pick Draft',
      count: pickDraftCount,
      status: 'draft',
      owner: 'Picking',
    },
    {
      stage: 'WMS Picking Docs',
      count: pickingDocs.length,
      status: 'preview',
      owner: 'WMS',
    },
    {
      stage: 'WMS Dispatch Docs',
      count: dispatchDocs.length,
      status: 'preview',
      owner: 'WMS',
    },
  ];

  return {
    soCandidateCount: candidates.length,
    openSoCount,
    activeReservationCount,
    pickCandidateCount: pickCandidates.length,
    readyToPickCount,
    pickDraftCount,
    pickingDocCount: pickingDocs.length,
    dispatchDocCount: dispatchDocs.length,
    pipeline,
  };
}

export async function getShortageOverviewMetrics() {
  const [summary, rows] = await Promise.all([
    getDemandPlanningSummary({ onlyShortage: true }),
    listDemandPlanningCandidates({ onlyShortage: true }),
  ]);

  const topShortages = [...rows]
    .sort((a, b) => Number(b.shortage_qty || 0) - Number(a.shortage_qty || 0))
    .slice(0, 15);

  return {
    summary,
    topShortages,
  };
}

export async function getManagementDashboardMetrics() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const [sales, inventory, demandSummary, reservations, fulfillment] = await Promise.all([
    getSalesDashboardMetrics(),
    getInventoryDashboardMetrics(),
    getDemandPlanningSummary({}),
    listReservations({ limit: 5000 }),
    getFulfillmentPipelineMetrics(),
  ]);

  const activeReservations = reservations.filter((r) => r.status === 'active').length;

  return {
    sales,
    inventory,
    demandSummary,
    activeReservations,
    fulfillment,
    kpis: [
      ['SO Lines', sales?.soCount ?? 0, 'Reservation candidate view'],
      ['Active Reservations', activeReservations, 'On hold for sales orders'],
      ['Shortage Lines', demandSummary?.shortStockLines ?? 0, 'Demand planning shortage'],
      ['Ready to Pick', demandSummary?.readyToPickLines ?? 0, 'Pick-pack candidate view'],
      ['Total Available Qty', inventory?.totalAvailable ?? 0, 'Inventory balance view'],
      ['WMS Picking Docs', fulfillment?.pickingDocCount ?? 0, 'Read-only WMS list'],
    ],
  };
}
