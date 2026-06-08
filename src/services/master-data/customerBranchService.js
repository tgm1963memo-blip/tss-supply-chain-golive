import { isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { getCustomers } from '../master-data/customerService.js';

const SEED_BRANCHES = [
  { customerCode: 'C001', customerName: 'ABC Retail Co.', branchCode: 'C001-BKK', branchName: 'Bangkok HQ', channel: 'Modern Trade', province: 'กรุงเทพมหานคร', status: 'active' },
  { customerCode: 'C001', customerName: 'ABC Retail Co.', branchCode: 'C001-CNX', branchName: 'Chiang Mai Branch', channel: 'Modern Trade', province: 'เชียงใหม่', status: 'active' },
  { customerCode: 'C002', customerName: 'Fresh Mart Ltd.', branchCode: 'C002-RYG', branchName: 'Rayong DC', channel: 'Wholesale', province: 'ระยอง', status: 'active' },
  { customerCode: 'C002', customerName: 'Fresh Mart Ltd.', branchCode: 'C002-BKK', branchName: 'Bangkok Store', channel: 'Retail', province: 'กรุงเทพมหานคร', status: 'active' },
  { customerCode: 'C003', customerName: 'Metro Foods', branchCode: 'C003-KKN', branchName: 'Khon Kaen', channel: 'Modern Trade', province: 'ขอนแก่น', status: 'active' },
  { customerCode: 'C003', customerName: 'Metro Foods', branchCode: 'C003-UDN', branchName: 'Udon Thani', channel: 'Modern Trade', province: 'อุดรธานี', status: 'active' },
  { customerCode: 'C004', customerName: 'City Wholesale', branchCode: 'C004-SPK', branchName: 'Samut Prakan', channel: 'Wholesale', province: 'สมุทรปราการ', status: 'active' },
  { customerCode: 'C004', customerName: 'City Wholesale', branchCode: 'C004-NST', branchName: 'Nakhon Si Thammarat', channel: 'Wholesale', province: 'นครศรีธรรมราช', status: 'inactive' },
];

export async function listCustomerBranches() {
  if (!isSupabaseConfigured()) {
    return SEED_BRANCHES;
  }

  try {
    const customers = await getCustomers({ limit: 500 });
    if (!customers.length) return SEED_BRANCHES;

    return SEED_BRANCHES.map((branch) => {
      const match = customers.find((c) => c.customerCode === branch.customerCode);
      return match
        ? { ...branch, customerName: match.customerName || branch.customerName, status: match.status || branch.status }
        : branch;
    });
  } catch {
    return SEED_BRANCHES;
  }
}

export function getCustomerBranchSummary(branches = []) {
  return {
    total: branches.length,
    active: branches.filter((b) => b.status === 'active').length,
    customers: new Set(branches.map((b) => b.customerCode)).size,
    channels: [...new Set(branches.map((b) => b.channel))].length,
  };
}
