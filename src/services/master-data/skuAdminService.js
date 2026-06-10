import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function buildSeedProducts() {
  return [
    {
      id: 'seed-1',
      roomCode: 'TSS',
      productCode: '10001',
      productName: 'ค็อกเทลซอสเซส 1000 g. (OFF)',
      productGroup: 'Sausage',
      uom: 'KG',
      plantCode: 'TGM1',
      activeStatus: 'active',
      packSize: 1,
      minStock: 50,
      shelfLifeDays: 30,
      leadTimeDays: 7,
      moq: 0,
      forecastClass: 'standard',
    },
    {
      id: 'seed-2',
      roomCode: 'TSS',
      productCode: '10003',
      productName: 'ไส้กรอกค็อกเทลรมควันหนังกรอบ 1000 g. OFF',
      productGroup: 'Sausage',
      uom: 'KG',
      plantCode: 'TGM1',
      activeStatus: 'active',
      packSize: 1,
      minStock: 50,
      shelfLifeDays: 45,
      leadTimeDays: 7,
      moq: 100,
      forecastClass: 'standard',
    },
  ];
}

function mapProduct(row) {
  return {
    id: row.id,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name,
    productGroup: row.product_group,
    uom: row.uom,
    plantCode: row.plant_code,
    activeStatus: row.active_status,
    packSize: Number(row.pack_size || 0),
    minStock: Number(row.min_stock || 0),
    shelfLifeDays: Number(row.shelf_life_days || 0),
    leadTimeDays: Number(row.lead_time_days || 0),
    moq: Number(row.moq || 0),
    forecastClass: row.forecast_class,
    syncedAt: row.synced_at,
  };
}

function mapRequest(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name,
    proposedChanges: row.proposed_changes || {},
    reason: row.reason,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

export async function listSkuAdminProducts(filters = {}) {
  let rows = [];
  let source = 'empty';

  if (isSupabaseConfigured()) {
    try {
      let compactQuery = supabase
        .from('sc_rm_product_master')
        .select('*')
        .order('product_code', { ascending: true })
        .limit(filters.limit || 500);

      if (filters.roomCode) compactQuery = compactQuery.eq('room_code', filters.roomCode);
      if (filters.productGroup) compactQuery = compactQuery.eq('product_group', filters.productGroup);
      if (filters.activeOnly) compactQuery = compactQuery.ilike('active_status', '%active%');

      const { data: compactData, error: compactError } = await compactQuery;
      if (!compactError && compactData?.length) {
        rows = compactData.map((row) => mapProduct({
          ...row,
          uom: row.unit_code,
          plant_code: '',
          pack_size: 0,
          min_stock: 0,
          shelf_life_days: 0,
          lead_time_days: 0,
          moq: 0,
          forecast_class: 'standard',
        }));
        source = 'live';
      }
    } catch {
      rows = [];
    }

    if (rows.length === 0) {
      try {
        let query = supabase
          .from('sc_web_sku_admin_view')
          .select('*')
          .order('product_code', { ascending: true })
          .limit(filters.limit || 500);

        if (filters.roomCode) query = query.eq('room_code', filters.roomCode);
        if (filters.productGroup) query = query.eq('product_group', filters.productGroup);
        if (filters.activeOnly) query = query.ilike('active_status', '%active%');

        const { data, error } = await query;
        if (!error && data?.length) {
          rows = data.map(mapProduct);
          source = 'live';
        }
      } catch {
        rows = [];
      }
    }
  }

  if (rows.length === 0) {
    rows = buildSeedProducts();
    source = 'seed';
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.productCode.toLowerCase().includes(q)
        || (r.productName || '').toLowerCase().includes(q)
        || (r.productGroup || '').toLowerCase().includes(q),
    );
  }

  const groups = [...new Set(rows.map((r) => r.productGroup).filter(Boolean))].sort();

  return {
    rows,
    groups,
    summary: {
      skuCount: rows.length,
      activeCount: rows.filter((r) => String(r.activeStatus).toLowerCase().includes('active')).length,
      groupCount: groups.length,
      lowMinStockCount: rows.filter((r) => r.minStock <= 0).length,
    },
    source,
  };
}

export async function listSkuSettingRequests() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sc_sku_setting_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequest);
}

export async function createSkuSettingRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const row = {
    request_no: payload.requestNo || `SKU-SET-${Date.now()}`,
    room_code: payload.roomCode || 'TSS',
    product_code: payload.productCode,
    product_name: payload.productName || payload.productCode,
    proposed_changes: payload.proposedChanges || {},
    reason: payload.reason || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_sku_setting_requests')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapRequest(data);
}

export { isSupabaseConfigured };
