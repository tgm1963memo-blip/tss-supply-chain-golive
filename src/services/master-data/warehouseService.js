import { supabase } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 100;

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
}

function normalizeSearch(search = '') {
  return search.trim().replaceAll(',', ' ');
}

function mapWarehouseRow(row) {
  const locations = row.sc_locations || [];

  return {
    id: row.id,
    roomCode: row.room_code,
    warehouseCode: row.warehouse_code,
    warehouseName: row.warehouse_name,
    warehouseType: row.warehouse_type,
    status: row.status,
    locations,
    updatedAt: row.updated_at,
  };
}

export async function getWarehouses({ search = '', limit = DEFAULT_LIMIT } = {}) {
  ensureSupabaseClient();

  const normalizedSearch = normalizeSearch(search);

  let query = supabase
    .from('sc_warehouses')
    .select(`
      id,
      room_code,
      warehouse_code,
      warehouse_name,
      warehouse_type,
      status,
      updated_at,
      sc_locations (
        id,
        location_code,
        zone_code,
        location_type,
        status
      )
    `)
    .order('room_code', { ascending: true })
    .order('warehouse_code', { ascending: true })
    .limit(limit);

  if (normalizedSearch) {
    query = query.or(
      [
        `room_code.ilike.%${normalizedSearch}%`,
        `warehouse_code.ilike.%${normalizedSearch}%`,
        `warehouse_name.ilike.%${normalizedSearch}%`,
        `warehouse_type.ilike.%${normalizedSearch}%`,
      ].join(','),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapWarehouseRow);
}

export async function getWarehouseById(warehouseId) {
  ensureSupabaseClient();

  const { data, error } = await supabase
    .from('sc_warehouses')
    .select(`
      id,
      room_code,
      warehouse_code,
      warehouse_name,
      warehouse_type,
      status,
      updated_at,
      sc_locations (
        id,
        location_code,
        zone_code,
        location_type,
        status
      )
    `)
    .eq('id', warehouseId)
    .single();

  if (error) {
    throw error;
  }

  return mapWarehouseRow(data);
}
