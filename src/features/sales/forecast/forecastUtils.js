export function currentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function fcTplLabel(tpl) {
  if (tpl === 'day') return 'รายวัน';
  if (tpl === 'month') return 'รายเดือน';
  if (tpl === 'cust') return 'รายลูกค้า';
  return 'รายสัปดาห์';
}

export function fcGridKey(month, cust, tpl) {
  return `${month || ''}|${cust || 'ALL'}|${tpl || 'week'}`;
}

export function fcTemplateCols(selMonth, tpl) {
  const [yr, mo] = selMonth
    ? selMonth.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  const mm = String(mo).padStart(2, '0');
  const lastDay = new Date(yr, mo, 0).getDate();

  if (tpl === 'day') {
    return Array.from({ length: lastDay }, (_, i) => {
      const d = String(i + 1).padStart(2, '0');
      return {
        lbl: d,
        sub: '',
        date: `${yr}-${mm}-${d}`,
        start: `${yr}-${mm}-${d}`,
        end: `${yr}-${mm}-${d}`,
      };
    });
  }

  if (tpl === 'month') {
    return [{
      lbl: 'เดือนนี้',
      sub: `01-${String(lastDay).padStart(2, '0')}`,
      date: `${yr}-${mm}-01`,
      start: `${yr}-${mm}-01`,
      end: `${yr}-${mm}-${String(lastDay).padStart(2, '0')}`,
    }];
  }

  return [1, 8, 15, 22].map((d, i) => {
    const e = [7, 14, 21, lastDay][i];
    const dd = String(d).padStart(2, '0');
    const ee = String(Math.min(e, lastDay)).padStart(2, '0');
    return {
      lbl: `สัปดาห์ ${i + 1}`,
      sub: `${dd}-${ee}`,
      date: `${yr}-${mm}-${dd}`,
      start: `${yr}-${mm}-${dd}`,
      end: `${yr}-${mm}-${ee}`,
    };
  });
}

export function fcColIndexForDate(date, cols) {
  const d = String(date || '').slice(0, 10);
  return cols.findIndex((c) => d >= c.start && d <= c.end);
}

export function fmtQty(value) {
  const n = Number(value || 0);
  if (!n) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function prevMonthYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return `${prevY}-${String(prevM).padStart(2, '0')}`;
}

export function prevYearYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${y - 1}-${String(m).padStart(2, '0')}`;
}

export function avg3FromMonthly(monthly) {
  const vals = Object.values(monthly || {}).map(Number).filter((v) => v > 0);
  if (!vals.length) return 0;
  return Math.round(vals.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, vals.length));
}
