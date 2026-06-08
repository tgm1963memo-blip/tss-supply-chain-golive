import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { listStockBalances } from '../warehouse/stockBalanceService.js';
import { listDemandPlanningCandidates } from '../planning/demandPlanningService.js';
import { loadForecasts } from '../../features/sales/forecast/forecastStorage.js';
import { LEGACY_SKUS, LEGACY_SALES_HIST } from '../../features/sales/forecast/legacyForecastData.js';

function aggregateForecastQty() {
  const forecasts = loadForecasts();
  const bySku = {};
  forecasts.forEach((f) => {
    bySku[f.sku] = (bySku[f.sku] || 0) + Number(f.qty || 0);
  });
  LEGACY_SKUS.forEach((s) => {
    if (!bySku[s.code]) {
      const hist = LEGACY_SALES_HIST[s.code];
      bySku[s.code] = hist?.avg3 || 0;
    }
  });
  return bySku;
}

function buildReason(shortage, leadTime, suggestProd, suggestPo) {
  if (shortage <= 0) return 'Stock covers forecast — no action';
  if (suggestProd > 0) return `Shortage ${shortage}; lead time ${leadTime}d — suggest in-house production`;
  if (suggestPo > 0) return `Shortage ${shortage}; lead time ${leadTime}d — suggest purchase order`;
  return 'Review manually';
}

function buildSeedSuggestions() {
  return LEGACY_SKUS.map((sku) => {
    const forecastQty = LEGACY_SALES_HIST[sku.code]?.avg3 || 1000;
    const currentStock = sku.code === '10001' ? 4200 : 800;
    const reserved = sku.code === '10001' ? 600 : 150;
    const shortage = Math.max(0, forecastQty + reserved - currentStock);
    const suggestProd = sku.lt <= 5 && shortage > 0 ? Math.ceil(shortage * 1.1) : 0;
    const suggestPo = sku.lt > 5 && shortage > 0 ? Math.ceil(shortage * 1.05) : 0;
    return {
      sku: sku.code,
      productName: sku.name,
      forecastQty,
      currentStock,
      reserved,
      shortage,
      leadTime: sku.lt,
      suggestedProductionQty: suggestProd,
      suggestedPurchaseQty: suggestPo,
      reason: buildReason(shortage, sku.lt, suggestProd, suggestPo),
    };
  });
}

export async function getProductionPurchaseSuggestions() {
  if (!isSupabaseConfigured()) {
    return { rows: buildSeedSuggestions(), source: 'seed' };
  }

  try {
    const forecastBySku = aggregateForecastQty();
    const [balances, demandRows] = await Promise.all([
      listStockBalances({ limit: 5000 }),
      listDemandPlanningCandidates({ onlyShortage: true }),
    ]);

    const stockBySku = {};
    balances.forEach((b) => {
      if (!stockBySku[b.productCode]) {
        stockBySku[b.productCode] = { onHand: 0, reserved: 0 };
      }
      stockBySku[b.productCode].onHand += b.calculatedOnHandQty || b.erpOnHandQty;
      stockBySku[b.productCode].reserved += b.reservedQty;
    });

    const shortageBySku = {};
    demandRows.forEach((r) => {
      shortageBySku[r.product_code] = (shortageBySku[r.product_code] || 0) + Number(r.shortage_qty || 0);
    });

    const skuMeta = Object.fromEntries(LEGACY_SKUS.map((s) => [s.code, s]));
    const allSkus = new Set([
      ...Object.keys(forecastBySku),
      ...Object.keys(stockBySku),
      ...Object.keys(shortageBySku),
    ]);

    const rows = [...allSkus].map((sku) => {
      const meta = skuMeta[sku] || { name: sku, lt: 7 };
      const forecastQty = forecastBySku[sku] || 0;
      const stock = stockBySku[sku] || { onHand: 0, reserved: 0 };
      const shortage = shortageBySku[sku] || Math.max(0, forecastQty + stock.reserved - stock.onHand);
      const leadTime = meta.lt || 7;
      const suggestProd = leadTime <= 5 && shortage > 0 ? Math.ceil(shortage * 1.1) : 0;
      const suggestPo = leadTime > 5 && shortage > 0 ? Math.ceil(shortage * 1.05) : 0;
      return {
        sku,
        productName: meta.name || sku,
        forecastQty,
        currentStock: stock.onHand,
        reserved: stock.reserved,
        shortage,
        leadTime,
        suggestedProductionQty: suggestProd,
        suggestedPurchaseQty: suggestPo,
        reason: buildReason(shortage, leadTime, suggestProd, suggestPo),
      };
    });

    return {
      rows: rows.filter((r) => r.forecastQty > 0 || r.shortage > 0).sort((a, b) => b.shortage - a.shortage),
      source: 'live',
    };
  } catch {
    return { rows: buildSeedSuggestions(), source: 'seed' };
  }
}
