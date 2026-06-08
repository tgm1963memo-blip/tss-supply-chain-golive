import { supabase } from '../../lib/supabaseClient.js';

export const SUPPORTED_UOMS = ['sachet', 'pack', 'carton', 'kg', 'piece'];

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
}

function normalizeUom(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRate(value) {
  const rate = Number(value);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('conversion_rate must be greater than 0.');
  }

  return rate;
}

function validateUom(value, fieldName) {
  const normalized = normalizeUom(value);

  if (!SUPPORTED_UOMS.includes(normalized)) {
    throw new Error(`${fieldName} must be one of: ${SUPPORTED_UOMS.join(', ')}`);
  }

  return normalized;
}

function mapConversionRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productCode: row.sc_products?.product_code || '',
    productName: row.sc_products?.product_name || '',
    fromUom: row.from_uom,
    toUom: row.to_uom,
    conversionRate: row.conversion_rate,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function getUomConversions({ search = '' } = {}) {
  ensureSupabaseClient();

  let query = supabase
    .from('sc_product_uom_conversion')
    .select(`
      id,
      product_id,
      from_uom,
      to_uom,
      conversion_rate,
      status,
      updated_at,
      sc_products (
        product_code,
        product_name
      )
    `)
    .order('updated_at', { ascending: false });

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    query = query.or(`from_uom.ilike.%${normalizedSearch}%,to_uom.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapConversionRow);
}

export async function getProductOptions({ search = '', limit = 100 } = {}) {
  ensureSupabaseClient();

  let query = supabase
    .from('sc_products')
    .select('id, product_code, product_name, base_uom, status')
    .eq('status', 'active')
    .order('product_code', { ascending: true })
    .limit(limit);

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    query = query.or(`product_code.ilike.%${normalizedSearch}%,product_name.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function upsertUomConversion({
  productId,
  fromUom,
  toUom,
  conversionRate,
  status = 'active',
}) {
  ensureSupabaseClient();

  if (!productId) {
    throw new Error('productId is required.');
  }

  const normalizedFromUom = validateUom(fromUom, 'fromUom');
  const normalizedToUom = validateUom(toUom, 'toUom');

  if (normalizedFromUom === normalizedToUom) {
    throw new Error('fromUom and toUom must be different.');
  }

  const payload = {
    product_id: productId,
    from_uom: normalizedFromUom,
    to_uom: normalizedToUom,
    conversion_rate: normalizeRate(conversionRate),
    status,
  };

  const { data, error } = await supabase
    .from('sc_product_uom_conversion')
    .upsert(payload, { onConflict: 'product_id,from_uom,to_uom' })
    .select(`
      id,
      product_id,
      from_uom,
      to_uom,
      conversion_rate,
      status,
      updated_at,
      sc_products (
        product_code,
        product_name
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return mapConversionRow(data);
}

export async function deactivateUomConversion(conversionId) {
  ensureSupabaseClient();

  const { data, error } = await supabase
    .from('sc_product_uom_conversion')
    .update({ status: 'inactive' })
    .eq('id', conversionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
