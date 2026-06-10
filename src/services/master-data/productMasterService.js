import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 500;

function buildSeedProducts() {
  return [
    {
      id: 'seed-1',
      roomCode: 'TSS',
      productCode: '10001',
      productName: 'ค็อกเทลซอสเซส 1000 g. (OFF)',
      productGroup: 'Sausage',
      uom: 'KG',
      barcode: '',
      activeStatus: 'active',
      syncedAt: null,
      updatedAt: null,
    },
  ];
}

function mapCompactProductRow(row) {
  return {
    id: `${row.room_code}:${row.product_code}`,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name || row.product_code,
    productGroup: row.product_group || row.category || '',
    uom: row.unit_code || 'KG',
    barcode: row.barcode || '',
    activeStatus: row.active_status || 'active',
    syncedAt: row.synced_at,
    updatedAt: row.synced_at,
  };
}

function mapProductMasterRow(row) {
  return {
    id: row.id,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name,
    productGroup: row.product_group,
    uom: row.uom,
    barcode: row.barcode || '',
    activeStatus: row.active_status || 'active',
    syncedAt: row.synced_at,
    updatedAt: row.updated_at,
  };
}

function mapExpressProductRow(row) {
  const raw = row.raw_data || {};
  return {
    id: row.id,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name || row.product_code,
    productGroup: row.product_group || raw.product_category || '',
    uom: row.uom || raw.base_uom || raw.unit || 'KG',
    barcode: raw.barcode || raw.barcod || raw.stkbar || '',
    activeStatus: raw.active_status || raw.is_active || 'active',
    syncedAt: row.synced_at,
    updatedAt: row.updated_at,
  };
}

function summarizeProducts(rows) {
  const groups = [...new Set(rows.map((r) => r.productGroup).filter(Boolean))];
  const activeRows = rows.filter((r) => String(r.activeStatus).toLowerCase().includes('active'));
  return {
    totalProducts: rows.length,
    activeProducts: activeRows.length,
    inactiveProducts: rows.length - activeRows.length,
    productGroups: groups.length,
    groups,
  };
}

export async function listProductMasterRows(filters = {}) {
  let rows = [];
  let source = 'empty';

  if (isSupabaseConfigured()) {
    try {
      let compactQuery = supabase
        .from('sc_rm_product_master')
        .select('*')
        .order('product_code', { ascending: true })
        .limit(filters.limit || DEFAULT_LIMIT);

      if (filters.roomCode) compactQuery = compactQuery.eq('room_code', filters.roomCode);
      if (filters.productGroup) compactQuery = compactQuery.eq('product_group', filters.productGroup);
      if (filters.activeStatus === 'active') compactQuery = compactQuery.ilike('active_status', '%active%');
      if (filters.activeStatus === 'inactive') compactQuery = compactQuery.not('active_status', 'ilike', '%active%');

      const { data: compactData, error: compactError } = await compactQuery;
      if (!compactError && compactData?.length) {
        rows = compactData.map(mapCompactProductRow);
        source = 'live';
      }
    } catch {
      rows = [];
    }

    if (rows.length === 0) {
      try {
        let query = supabase
          .from('sc_web_product_master_view')
          .select('*')
          .order('product_code', { ascending: true })
          .limit(filters.limit || DEFAULT_LIMIT);

        if (filters.roomCode) query = query.eq('room_code', filters.roomCode);
        if (filters.productGroup) query = query.eq('product_group', filters.productGroup);
        if (filters.activeStatus === 'active') query = query.ilike('active_status', '%active%');
        if (filters.activeStatus === 'inactive') query = query.not('active_status', 'ilike', '%active%');

        const { data, error } = await query;
        if (!error && data?.length) {
          rows = data.map(mapProductMasterRow);
          source = 'live';
        }
      } catch {
        rows = [];
      }
    }

    if (rows.length === 0) {
      try {
        let skuQuery = supabase
          .from('sc_web_sku_admin_view')
          .select('*')
          .order('product_code', { ascending: true })
          .limit(filters.limit || DEFAULT_LIMIT);

        if (filters.roomCode) skuQuery = skuQuery.eq('room_code', filters.roomCode);
        if (filters.productGroup) skuQuery = skuQuery.eq('product_group', filters.productGroup);

        const { data, error } = await skuQuery;
        if (!error && data?.length) {
          rows = data.map((row) => mapProductMasterRow({
            ...row,
            barcode: '',
            active_status: row.active_status,
          }));
          source = 'live';
        }
      } catch {
        rows = [];
      }
    }

    if (rows.length === 0) {
      try {
        let fallbackQuery = supabase
          .from('sc_express_products')
          .select('id, room_code, product_code, product_name, product_group, uom, raw_data, synced_at, updated_at')
          .order('product_code', { ascending: true })
          .limit(filters.limit || DEFAULT_LIMIT);

        if (filters.roomCode) fallbackQuery = fallbackQuery.eq('room_code', filters.roomCode);

        const { data, error } = await fallbackQuery;
        if (!error && data?.length) {
          rows = data.map(mapExpressProductRow);
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
        || (r.barcode || '').toLowerCase().includes(q)
        || (r.productGroup || '').toLowerCase().includes(q),
    );
  }

  if (filters.productGroup && source === 'seed') {
    rows = rows.filter((r) => r.productGroup === filters.productGroup);
  }

  if (filters.activeStatus === 'active') {
    rows = rows.filter((r) => String(r.activeStatus).toLowerCase().includes('active'));
  } else if (filters.activeStatus === 'inactive') {
    rows = rows.filter((r) => !String(r.activeStatus).toLowerCase().includes('active'));
  }

  const summary = summarizeProducts(rows);

  return {
    rows,
    summary,
    groups: summary.groups,
    source,
  };
}

export { isSupabaseConfigured };
