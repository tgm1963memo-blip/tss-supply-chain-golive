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

function hasWeightMarker(product) {
  const sourceText = [
    product.product_name,
    product.product_description,
    product.erpProduct?.product_name,
    product.erpProduct?.product_description,
    product.erpProduct?.raw_data?.stkdes,
    product.erpProduct?.raw_data?.stkdes2,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return sourceText.includes('(t)');
}

function mapProductRow(row) {
  const erpProduct = row.sc_express_products || null;
  const aliases = row.sc_product_alias || [];
  const uomConversions = row.sc_product_uom_conversion || [];

  return {
    id: row.id,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name,
    productGroup: row.product_group,
    baseUom: row.base_uom,
    needWeight: Boolean(row.need_weight) || hasWeightMarker({
      product_name: row.product_name,
      product_description: null,
      erpProduct,
    }),
    minStock: row.min_stock,
    shelfLifeDays: row.shelf_life_days,
    status: row.status,
    erpProduct,
    aliases,
    uomConversions,
    updatedAt: row.updated_at,
  };
}

export async function getProducts({ search = '', limit = DEFAULT_LIMIT } = {}) {
  if (!supabase) {
    return [];
  }

  const normalizedSearch = normalizeSearch(search);

  let query = supabase
    .from('sc_products')
    .select(`
      id,
      room_code,
      product_code,
      product_name,
      product_group,
      base_uom,
      need_weight,
      min_stock,
      shelf_life_days,
      status,
      updated_at,
      sc_express_products (
        id,
        room_code,
        product_code,
        product_name,
        product_description,
        product_group,
        uom,
        raw_data,
        source_updated_at
      ),
      sc_product_alias (
        id,
        alias_code,
        alias_name,
        status
      ),
      sc_product_uom_conversion (
        id,
        from_uom,
        to_uom,
        conversion_rate,
        status
      )
    `)
    .order('product_code', { ascending: true })
    .limit(limit);

  if (normalizedSearch) {
    query = query.or(`product_code.ilike.%${normalizedSearch}%,product_name.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapProductRow);
}

export async function getProductById(productId) {
  ensureSupabaseClient();

  const { data, error } = await supabase
    .from('sc_products')
    .select(`
      id,
      room_code,
      product_code,
      product_name,
      product_group,
      base_uom,
      need_weight,
      min_stock,
      shelf_life_days,
      status,
      updated_at,
      sc_express_products (
        id,
        room_code,
        product_code,
        product_name,
        product_description,
        product_group,
        uom,
        raw_data,
        source_updated_at
      ),
      sc_product_alias (
        id,
        alias_code,
        alias_name,
        status
      ),
      sc_product_uom_conversion (
        id,
        from_uom,
        to_uom,
        conversion_rate,
        status
      )
    `)
    .eq('id', productId)
    .single();

  if (error) {
    throw error;
  }

  return mapProductRow(data);
}
