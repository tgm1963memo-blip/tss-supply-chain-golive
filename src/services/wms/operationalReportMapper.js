function formatDate(value) {
  if (!value) return '-';
  const text = String(value);
  return text.includes('T') ? text.split('T')[0] : text;
}

export function mapMovementLedgerToInventoryReportData({ rows = [], filters = {}, summary = null }) {
  const mappedLines = rows.map((row, index) => ({
    id: row.id ?? `row-${index}`,
    date: formatDate(row.movement_date ?? row.created_at),
    receivedDate: formatDate(row.received_date ?? row.inbound_date),
    deliveryDate: formatDate(row.delivery_date ?? row.outbound_date),
    lotNo: row.lot_no ?? row.lot_id ?? '-',
    customerProduct: row.customer_product ?? row.product_name ?? row.product_id ?? '-',
    descCode: row.product_code ?? row.product_id ?? '-',
    weightKg: row.weight ?? row.weight_kg ?? '-',
    balanceForward: row.balance_forward ?? row.opening_balance ?? '-',
    received: row.received_qty ?? row.inbound_qty ?? '-',
    delivery: row.delivery_qty ?? row.outbound_qty ?? '-',
    balance: row.balance_qty ?? row.closing_balance ?? '-',
    volumeUnit: row.volume_unit ?? row.uom ?? '-',
    remark: row.remark ?? '-',
  }));

  const subtotalReceived = mappedLines.reduce((total, line) => total + (Number(line.received) || 0), 0);
  const subtotalDelivery = mappedLines.reduce((total, line) => total + (Number(line.delivery) || 0), 0);
  const subtotalWeight = mappedLines.reduce((total, line) => total + (Number(line.weightKg) || 0), 0);

  return {
    customer: filters.customer_name ?? filters.customer_id ?? summary?.customerName ?? '-',
    address: filters.customer_address ?? '-',
    reportMonth: filters.report_month ?? '-',
    dateFrom: formatDate(filters.date_from ?? filters.from_date ?? filters.dateFrom),
    dateTo: formatDate(filters.date_to ?? filters.to_date ?? filters.dateTo),
    issuedDate: formatDate(new Date().toISOString()),
    lines: mappedLines,
    subtotalReceived,
    subtotalDelivery,
    subtotalWeight,
    totalReceived: summary?.totalInboundQty ?? subtotalReceived,
    totalDelivery: summary?.totalOutboundQty ?? subtotalDelivery,
    totalWeight: subtotalWeight,
  };
}
