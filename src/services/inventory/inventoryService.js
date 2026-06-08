import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 100;
const DEFAULT_LOW_STOCK_THRESHOLD = 0;

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function normalizeSearch(search = '') {
  return search.trim().replaceAll(',', ' ');
}

function mapAvailabilityRow(row) {
  return {
    roomCode: row.room_code,
    productCode: row.product_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    lotNo: row.lot_no,
    onHandQty: Number(row.on_hand_qty || 0),
    reservedQty: Number(row.reserved_qty || 0),
    availableQty: Number(row.available_qty || 0),
    futureSupplyQty: Number(row.future_supply_qty || 0),
    sourceUpdatedAt: row.source_updated_at,
  };
}

function applyAvailabilityFilters(query, filters = {}) {
  const {
    roomCode,
    productCode,
    warehouseCode,
    locationCode,
    lotNo,
    search = '',
  } = filters;

  let nextQuery = query;

  if (roomCode) {
    nextQuery = nextQuery.eq('room_code', roomCode);
  }

  if (productCode) {
    nextQuery = nextQuery.eq('product_code', productCode);
  }

  if (warehouseCode) {
    nextQuery = nextQuery.eq('warehouse_code', warehouseCode);
  }

  if (locationCode) {
    nextQuery = nextQuery.eq('location_code', locationCode);
  }

  if (lotNo) {
    nextQuery = nextQuery.eq('lot_no', lotNo);
  }

  const normalizedSearch = normalizeSearch(search);
  if (normalizedSearch) {
    nextQuery = nextQuery.or(
      [
        `product_code.ilike.%${normalizedSearch}%`,
        `warehouse_code.ilike.%${normalizedSearch}%`,
        `location_code.ilike.%${normalizedSearch}%`,
        `lot_no.ilike.%${normalizedSearch}%`,
      ].join(','),
    );
  }

  return nextQuery;
}

export async function listInventoryAvailability(filters = {}) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const limit = filters.limit || DEFAULT_LIMIT;

  let query = supabase
    .from('sc_inventory_available_view')
    .select(`
      room_code,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      on_hand_qty,
      reserved_qty,
      available_qty,
      future_supply_qty,
      source_updated_at
    `)
    .order('product_code', { ascending: true })
    .order('warehouse_code', { ascending: true })
    .order('location_code', { ascending: true })
    .limit(limit);

  query = applyAvailabilityFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapAvailabilityRow);
}

export async function getInventoryAvailabilityByProduct(productCode, filters = {}) {
  if (!productCode) {
    throw new Error('productCode is required.');
  }

  return listInventoryAvailability({
    ...filters,
    productCode,
  });
}

export async function listInventoryBalances(filters = {}) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const limit = filters.limit || DEFAULT_LIMIT;

  let query = supabase
    .from('sc_inventory_balance_view')
    .select(`
      room_code,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      erp_on_hand_qty,
      ledger_delta_qty,
      calculated_on_hand_qty,
      reserved_qty,
      available_qty,
      future_supply_qty,
      source_updated_at
    `)
    .order('product_code', { ascending: true })
    .order('warehouse_code', { ascending: true })
    .order('location_code', { ascending: true })
    .limit(limit);

  query = applyAvailabilityFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    roomCode: row.room_code,
    productCode: row.product_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    lotNo: row.lot_no,
    erpOnHandQty: Number(row.erp_on_hand_qty || 0),
    ledgerDeltaQty: Number(row.ledger_delta_qty || 0),
    calculatedOnHandQty: Number(row.calculated_on_hand_qty || 0),
    reservedQty: Number(row.reserved_qty || 0),
    availableQty: Number(row.available_qty || 0),
    futureSupplyQty: Number(row.future_supply_qty || 0),
    sourceUpdatedAt: row.source_updated_at,
  }));
}

export async function getInventoryBalanceByProduct(productCode, filters = {}) {
  if (!productCode) {
    throw new Error('productCode is required.');
  }
  return listInventoryBalances({ ...filters, productCode });
}

export async function getNegativeInventoryBalances(filters = {}) {
  ensureSupabaseClient();
  const limit = filters.limit || DEFAULT_LIMIT;
  let query = supabase
    .from('sc_inventory_balance_view')
    .select(`
      room_code,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      available_qty
    `)
    .lt('available_qty', 0)
    .order('available_qty', { ascending: true })
    .limit(limit);

  query = applyAvailabilityFilters(query, filters);

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data || []).map(mapAvailabilityRow);
}

export async function getLowAvailableStock(options = {}) {
  ensureSupabaseClient();

  const threshold = Number(options.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
  const limit = options.limit || DEFAULT_LIMIT;

  let query = supabase
    .from('sc_inventory_balance_view')
    .select(`
      room_code,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      on_hand_qty,
      reserved_qty,
      available_qty,
      future_supply_qty,
      source_updated_at
    `)
    .lte('available_qty', threshold)
    .order('available_qty', { ascending: true })
    .limit(limit);

  query = applyAvailabilityFilters(query, options);

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data || []).map(mapAvailabilityRow);
}
