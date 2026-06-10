/** Legacy pgPlanStock comparison criteria (from tgm-supplychain/index.html PS_CRITS_ALL). */

export const PS_CRITS_ALL = [
  { key: 'avg3', lbl: 'เฉลี่ย 3 เดือน' },
  { key: 'avg4', lbl: 'เฉลี่ย 4 เดือน' },
  { key: 'last1', lbl: 'เดือนล่าสุด' },
  { key: 'prevyear', lbl: 'ปีที่แล้ว' },
  { key: 'weekly', lbl: 'รายสัปดาห์' },
];

export const DEFAULT_PS_CRITS = ['avg3'];

export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
