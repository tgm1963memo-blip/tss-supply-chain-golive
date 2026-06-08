import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { listStockBalances } from '../warehouse/stockBalanceService.js';
import { listSalesOrderReservationCandidates } from '../sales/reservationSourceService.js';
import { LEGACY_SKUS } from '../../features/sales/forecast/legacyForecastData.js';

function suggestAction(atp, shortage) {
  if (shortage > 0) return 'Review shortage / reserve';
  if (atp <= 0) return 'No ATP — plan supply';
  if (atp < 100) return 'Low ATP — monitor';
  return 'OK';
}

function buildSeedAtpRows() {
  return LEGACY_SKUS.map((sku) => {
    const onHand = sku.code === '10001' ? 5200 : sku.code === '10003' ? 1800 : 900;
    const reserved = sku.code === '10001' ? 800 : 200;
    const pendingSo = sku.code === '10001' ? 1200 : sku.code === '10008' ? 950 : 100;
    const atp = onHand - reserved - pendingSo;
    const shortage = atp < 0 ? Math.abs(atp) : 0;
    return {
      sku: sku.code,
      productName: sku.name,
      onHand,
      reserved,
      pendingSo,
      available: onHand - reserved,
      atp,
      shortage,
      suggestedAction: suggestAction(atp, shortage),
    };
  });
}

export async function getAtpWorkbenchRows() {
  if (!isSupabaseConfigured()) {
    return { rows: buildSeedAtpRows(), source: 'seed' };
  }

  try {
    const [balances, candidates] = await Promise.all([
      listStockBalances({ limit: 5000 }),
      listSalesOrderReservationCandidates({ limit: 5000 }),
    ]);

    const byProduct = {};

    balances.forEach((b) => {
      if (!byProduct[b.productCode]) {
        byProduct[b.productCode] = { onHand: 0, reserved: 0, available: 0 };
      }
      byProduct[b.productCode].onHand += b.erpOnHandQty;
      byProduct[b.productCode].reserved += b.reservedQty;
      byProduct[b.productCode].available += b.availableQty;
    });

    const pendingByProduct = {};
    candidates
      .filter((c) => !c.reservationExists || c.reservationStatus !== 'released')
      .forEach((c) => {
        pendingByProduct[c.productCode] = (pendingByProduct[c.productCode] || 0) + c.orderedQty;
      });

    const allSkus = new Set([...Object.keys(byProduct), ...Object.keys(pendingByProduct)]);

    const rows = [...allSkus].map((sku) => {
      const stock = byProduct[sku] || { onHand: 0, reserved: 0, available: 0 };
      const pendingSo = pendingByProduct[sku] || 0;
      const atp = stock.onHand - stock.reserved - pendingSo;
      const shortage = atp < 0 ? Math.abs(atp) : 0;
      return {
        sku,
        productName: sku,
        onHand: stock.onHand,
        reserved: stock.reserved,
        pendingSo,
        available: stock.available,
        atp,
        shortage,
        suggestedAction: suggestAction(atp, shortage),
      };
    });

    return { rows: rows.sort((a, b) => b.shortage - a.shortage), source: 'live' };
  } catch {
    return { rows: buildSeedAtpRows(), source: 'seed' };
  }
}

export async function getAtpSummary(rows = []) {
  return {
    skuCount: rows.length,
    shortageLines: rows.filter((r) => r.shortage > 0).length,
    lowAtpLines: rows.filter((r) => r.atp >= 0 && r.atp < 100).length,
    okLines: rows.filter((r) => r.atp >= 100 && r.shortage === 0).length,
  };
}
