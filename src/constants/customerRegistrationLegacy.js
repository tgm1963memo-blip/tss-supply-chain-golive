/** Legacy CR_DOC_SLOTS from tgm-supplychain/index.html */
export const CR_DOC_SLOTS = [
  {
    id: 'id-card',
    group: 'main',
    label: 'สำเนาบัตรประชาชน',
    req: true,
    hint: 'บัตรปชช. เจ้าของ/กรรมการ',
    maxFiles: 3,
  },
  {
    id: 'tax-cert',
    group: 'main',
    label: 'ทะเบียนร้าน / หนังสือรับรองบริษัท',
    req: true,
    hint: 'อายุไม่เกิน 6 เดือน',
    maxFiles: 2,
  },
  {
    id: 'vat-20',
    group: 'main',
    label: 'ใบทะเบียน VAT (ภ.พ.20)',
    req: false,
    hint: 'สำหรับกิจการจด VAT',
    maxFiles: 1,
  },
  {
    id: 'map-doc',
    group: 'main',
    label: 'แผนที่ร้านค้า / สถานที่จัดส่ง',
    req: false,
    hint: 'รูปแผนที่หรือ screenshot',
    maxFiles: 3,
  },
  {
    id: 'shop-photo',
    group: 'other',
    label: 'รูปถ่ายหน้าร้าน / สถานที่',
    req: true,
    hint: 'อย่างน้อย 1 รูป',
    maxFiles: 10,
  },
  {
    id: 'other-doc',
    group: 'other',
    label: 'เอกสารอื่นๆ',
    req: false,
    hint: 'ระบุชื่อในหมายเหตุ',
    maxFiles: 10,
  },
];

export const CUSTREG_REQUEST_TYPES = [
  { value: 'new_customer', label: 'New Customer / ร้านค้าใหม่' },
  { value: 'edit_customer', label: 'Edit Customer / เปลี่ยนแปลงข้อมูลลูกค้าเก่า' },
  { value: 'add_branch', label: 'Add Branch / เพิ่มสาขา' },
  { value: 'credit_change', label: 'Credit Change / เปลี่ยนเครดิต' },
  { value: 'suspend', label: 'Suspend / ระงับ' },
];

export function emptyDocumentSlots() {
  return CR_DOC_SLOTS.map((slot) => ({
    id: slot.id,
    label: slot.label,
    note: '',
    files: [],
  }));
}

export function normalizeDocumentSlots(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return emptyDocumentSlots();
  const byId = Object.fromEntries(raw.map((s) => [s.id, s]));
  return CR_DOC_SLOTS.map((slot) => ({
    id: slot.id,
    label: slot.label,
    note: byId[slot.id]?.note || '',
    files: Array.isArray(byId[slot.id]?.files) ? byId[slot.id].files : [],
  }));
}
