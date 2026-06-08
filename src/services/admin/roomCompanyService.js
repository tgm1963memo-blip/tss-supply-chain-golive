/** Read-only room / company / source system config preview (seed data). */

const SEED_ROOMS = [
  {
    roomCode: 'TSS',
    companyName: 'TSS Coldstorage Co., Ltd.',
    sourceSystem: 'Express ERP',
    warehouseScope: 'Main Cold Room + Dry WH',
    active: true,
    notes: 'Primary room_code used in reservation and stock balance views',
  },
  {
    roomCode: 'TGD',
    companyName: 'TGD Warehouse Operations',
    sourceSystem: 'Express ERP',
    warehouseScope: 'WMS operational scope',
    active: true,
    notes: 'Legacy TGD room filter — used in WMS tgd_* tables',
  },
  {
    roomCode: 'CONSI',
    companyName: 'Modern Trade / Consignment',
    sourceSystem: 'Import / Branch Stock',
    warehouseScope: 'Branch consignment only',
    active: true,
    notes: 'CONSI branch stock preview — no settlement write-back in golive',
  },
  {
    roomCode: 'UAT',
    companyName: 'UAT Sandbox',
    sourceSystem: 'Express ERP (UAT)',
    warehouseScope: 'Test warehouse',
    active: false,
    notes: 'Inactive — for UAT validation only',
  },
];

export function listRoomCompanyConfig() {
  return SEED_ROOMS;
}

export function getRoomCompanySummary(rooms = SEED_ROOMS) {
  return {
    total: rooms.length,
    active: rooms.filter((r) => r.active).length,
    sourceSystems: [...new Set(rooms.map((r) => r.sourceSystem))],
  };
}
