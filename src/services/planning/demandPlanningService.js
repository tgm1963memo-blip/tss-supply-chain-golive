import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

/**
 * Phase L2A Demand Planning Service
 * STRICTLY READ-ONLY
 * No Mutations, No RPC calls for insert/update/delete.
 */

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

export async function listDemandPlanningCandidates(filters = {}) {
  ensureSupabaseClient();

  let query = supabase
    .from('sc_so_pick_pack_candidate_view')
    .select('*');

  if (filters.room) {
    query = query.ilike('wh_room', `%${filters.room}%`);
  }
  if (filters.deliveryDateFrom) {
    query = query.gte('ship_date', filters.deliveryDateFrom);
  }
  if (filters.deliveryDateTo) {
    query = query.lte('ship_date', filters.deliveryDateTo);
  }
  if (filters.customer) {
    query = query.or(`customer_code.ilike.%${filters.customer}%,customer_name.ilike.%${filters.customer}%`);
  }
  if (filters.product) {
    query = query.or(`product_code.ilike.%${filters.product}%,product_name.ilike.%${filters.product}%`);
  }
  if (filters.pickReadiness) {
    query = query.eq('pick_readiness', filters.pickReadiness);
  }
  if (filters.onlyShortage) {
    query = query.gt('shortage_qty', 0);
  }
  if (filters.onlyNotReserved) {
    query = query.eq('reserved_qty', 0);
  }
  if (filters.onlyReadyToPick) {
    query = query.eq('pick_readiness', 'READY_TO_PICK');
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getDemandPlanningSummary(filters = {}) {
  const candidates = await listDemandPlanningCandidates(filters);

  let totalOpenSoDemandLines = candidates.length;
  let totalRequiredQty = 0;
  let totalAvailableQty = 0;
  let totalReservedQty = 0;
  let totalShortageQty = 0;
  let readyToPickLines = 0;
  let notReservedButAvailableLines = 0;
  let shortStockLines = 0;
  let pickDraftExistsLines = 0;
  let pickConfirmedLines = 0;

  candidates.forEach((c) => {
    totalRequiredQty += Number(c.required_qty || 0);
    totalAvailableQty += Number(c.available_qty || 0);
    totalReservedQty += Number(c.reserved_qty || 0);
    totalShortageQty += Number(c.shortage_qty || 0);

    if (c.pick_readiness === 'READY_TO_PICK') readyToPickLines += 1;
    if (Number(c.reserved_qty) === 0 && Number(c.available_qty) >= Number(c.required_qty)) {
      notReservedButAvailableLines += 1;
    }
    if (Number(c.shortage_qty) > 0) shortStockLines += 1;
    if (c.pick_readiness === 'PICK_DRAFT_EXISTS') pickDraftExistsLines += 1;
    if (c.pick_readiness === 'PICKING_CONFIRMED') pickConfirmedLines += 1;
  });

  return {
    totalOpenSoDemandLines,
    totalRequiredQty,
    totalAvailableQty,
    totalReservedQty,
    totalShortageQty,
    readyToPickLines,
    notReservedButAvailableLines,
    shortStockLines,
    pickDraftExistsLines,
    pickConfirmedLines,
  };
}

export function buildPlannerWorkbenchRows(candidates = []) {
  const grouped = {};

  candidates.forEach((c) => {
    const key = `${c.ship_date}_${c.customer_code}_${c.product_code}`;

    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        shipDate: c.ship_date,
        customerCode: c.customer_code,
        customerName: c.customer_name,
        productCode: c.product_code,
        productName: c.product_name,
        demandLines: 0,
        requiredQty: 0,
        reservedQty: 0,
        availableQty: 0,
        shortageQty: 0,
        pickReadinessSummary: new Set(),
        details: [],
      };
    }

    const group = grouped[key];
    group.demandLines += 1;
    group.requiredQty += Number(c.required_qty || 0);
    group.reservedQty += Number(c.reserved_qty || 0);
    group.availableQty = Math.max(group.availableQty, Number(c.available_qty || 0));
    group.shortageQty += Number(c.shortage_qty || 0);
    if (c.pick_readiness) group.pickReadinessSummary.add(c.pick_readiness);
    group.details.push(c);
  });

  return Object.values(grouped).map((group) => {
    let recommendation = 'Review shortage';

    if (group.pickReadinessSummary.has('READY_TO_PICK')) {
      recommendation = 'Available to pick';
    } else if (group.pickReadinessSummary.has('PICKING_CONFIRMED')) {
      recommendation = 'Pick confirmed';
    } else if (group.pickReadinessSummary.has('PICK_DRAFT_EXISTS')) {
      recommendation = 'Pick draft exists';
    } else if (group.shortageQty > 0) {
      recommendation = 'Review shortage';
    } else if (group.reservedQty > 0 && group.reservedQty >= group.requiredQty) {
      recommendation = 'Already reserved';
    } else if (group.availableQty >= group.requiredQty && group.reservedQty === 0) {
      recommendation = 'Optional lock stock';
    } else if (group.availableQty > 0 && group.availableQty < group.requiredQty) {
      recommendation = 'Check stock allocation';
    }

    return {
      ...group,
      pickReadinessSummary: Array.from(group.pickReadinessSummary).join(', '),
      recommendation,
    };
  });
}

export { isSupabaseConfigured };
