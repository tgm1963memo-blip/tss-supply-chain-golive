import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { getCustomers } from '../master-data/customerService.js';

/** Seed branch/location data for planning when live geodata is unavailable. */
const SEED_LOCATIONS = [
  { customerCode: 'C001', customerName: 'ABC Retail Co.', branchCode: 'C001-BKK', branchName: 'Bangkok HQ', province: 'กรุงเทพมหานคร', zone: 'Central', channel: 'Modern Trade', lat: 13.75, lng: 100.5, status: 'active' },
  { customerCode: 'C001', customerName: 'ABC Retail Co.', branchCode: 'C001-CNX', branchName: 'Chiang Mai', province: 'เชียงใหม่', zone: 'North', channel: 'Modern Trade', lat: 18.79, lng: 98.98, status: 'active' },
  { customerCode: 'C002', customerName: 'Fresh Mart Ltd.', branchCode: 'C002-RYG', branchName: 'Rayong DC', province: 'ระยอง', zone: 'East', channel: 'Wholesale', lat: 12.68, lng: 101.28, status: 'active' },
  { customerCode: 'C002', customerName: 'Fresh Mart Ltd.', branchCode: 'C002-BKK', branchName: 'Bangkok Store', province: 'กรุงเทพมหานคร', zone: 'Central', channel: 'Retail', lat: 13.72, lng: 100.58, status: 'active' },
  { customerCode: 'C003', customerName: 'Metro Foods', branchCode: 'C003-KKN', branchName: 'Khon Kaen', province: 'ขอนแก่น', zone: 'Northeast', channel: 'Modern Trade', lat: 16.43, lng: 102.83, status: 'active' },
  { customerCode: 'C003', customerName: 'Metro Foods', branchCode: 'C003-UDN', branchName: 'Udon Thani', province: 'อุดรธานี', zone: 'Northeast', channel: 'Modern Trade', lat: 17.41, lng: 102.79, status: 'active' },
  { customerCode: 'C004', customerName: 'City Wholesale', branchCode: 'C004-SPK', branchName: 'Samut Prakan', province: 'สมุทรปราการ', zone: 'Central', channel: 'Wholesale', lat: 13.60, lng: 100.60, status: 'active' },
  { customerCode: 'C004', customerName: 'City Wholesale', branchCode: 'C004-NST', branchName: 'Nakhon Si Thammarat', province: 'นครศรีธรรมราช', zone: 'South', channel: 'Wholesale', lat: 8.43, lng: 99.96, status: 'inactive' },
];

export function listCustomerMapLocations() {
  return SEED_LOCATIONS;
}

export async function getCustomerMapSummary() {
  let locations = SEED_LOCATIONS;

  if (isSupabaseConfigured()) {
    try {
      const customers = await getCustomers({ limit: 500 });
      if (customers.length) {
        locations = SEED_LOCATIONS.map((seed) => {
          const match = customers.find((c) => c.customerCode === seed.customerCode);
          return match
            ? { ...seed, customerName: match.customerName || seed.customerName, status: match.status || seed.status }
            : seed;
        });
      }
    } catch {
      /* fall back to seed */
    }
  }

  const byZone = locations.reduce((acc, loc) => {
    acc[loc.zone] = acc[loc.zone] || { zone: loc.zone, count: 0, active: 0 };
    acc[loc.zone].count += 1;
    if (loc.status === 'active') acc[loc.zone].active += 1;
    return acc;
  }, {});

  const byProvince = locations.reduce((acc, loc) => {
    acc[loc.province] = (acc[loc.province] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCustomers: new Set(locations.map((l) => l.customerCode)).size,
    totalBranches: locations.length,
    activeBranches: locations.filter((l) => l.status === 'active').length,
    zones: Object.values(byZone),
    provinces: Object.entries(byProvince)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count),
    locations,
  };
}
