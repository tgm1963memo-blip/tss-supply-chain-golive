import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function buildSeedReceivingRows() {
  return [
    {
      documentNo: 'PO-2410-0150',
      sourceType: 'External Supplier',
      supplierName: 'CP Foods PCL.',
      expectedQty: 5000,
      receivedQty: 0,
      status: 'pending',
      transferDate: new Date().toISOString().slice(0, 10),
    },
    {
      documentNo: 'PRD-2410-001',
      sourceType: 'Production Order',
      supplierName: 'Plant A',
      expectedQty: 2500,
      receivedQty: 1200,
      status: 'in_progress',
      transferDate: new Date().toISOString().slice(0, 10),
    },
    {
      documentNo: 'PO-2410-0142',
      sourceType: 'External Supplier',
      supplierName: 'Betagro PCL.',
      expectedQty: 10000,
      receivedQty: 10000,
      status: 'completed',
      transferDate: new Date().toISOString().slice(0, 10),
    },
  ];
}

function mapTransferRow(row) {
  const raw = row.raw_data || {};
  return {
    id: row.id,
    documentNo: row.document_no,
    roomCode: row.room_code,
    sourceType: raw.source_type || raw.doc_type || 'transfer',
    supplierName: raw.supplier_name || raw.from_name || row.from_warehouse_code || '-',
    expectedQty: Number(raw.expected_qty || raw.qty || 0),
    receivedQty: Number(raw.received_qty || 0),
    status: row.status || 'synced',
    transferDate: row.transfer_date,
  };
}

function summarize(rows) {
  return {
    expectedToday: rows.length,
    inProgress: rows.filter((r) => ['in_progress', 'partial', 'synced'].includes(String(r.status).toLowerCase()) && r.receivedQty > 0 && r.receivedQty < r.expectedQty).length,
    completed: rows.filter((r) => String(r.status).toLowerCase() === 'completed' || (r.expectedQty > 0 && r.receivedQty >= r.expectedQty)).length,
    discrepancies: rows.filter((r) => r.expectedQty > 0 && r.receivedQty > 0 && r.receivedQty !== r.expectedQty).length,
  };
}

export async function getReceivingSchedule(filters = {}) {
  let rows = buildSeedReceivingRows();
  let source = 'seed';

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('sc_express_transfers')
        .select('id, room_code, document_no, from_warehouse_code, to_warehouse_code, transfer_date, status, raw_data')
        .order('transfer_date', { ascending: false })
        .limit(filters.limit || 100);

      if (filters.search) {
        query = query.ilike('document_no', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if ((data || []).length > 0) {
        rows = data.map(mapTransferRow);
        source = 'live';
      }
    } catch {
      rows = buildSeedReceivingRows();
      source = 'seed';
    }
  } else if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((r) => r.documentNo.toLowerCase().includes(q));
  }

  return { rows, summary: summarize(rows), source };
}

export { isSupabaseConfigured };
