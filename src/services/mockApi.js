/**
 * Mock service layer — safe read-only stubs.
 * No Supabase, Express, or production API connections.
 */

export async function fetchMockSalesOrders() {
  const { mockSalesOrders } = await import('../data/mockSalesOrders.js');
  return mockSalesOrders;
}

export async function fetchMockInventory() {
  const { mockInventory } = await import('../data/mockInventory.js');
  return mockInventory;
}

export async function fetchMockWmsTasks() {
  const { mockWmsTasks } = await import('../data/mockWms.js');
  return mockWmsTasks;
}

export async function fetchMockConsignment() {
  const { mockConsignment } = await import('../data/mockConsignment.js');
  return mockConsignment;
}

export async function fetchMockMasterData(type = 'products') {
  const data = await import('../data/mockMasterData.js');
  return data.default[type] ?? [];
}

export const MOCKUP_DISCLAIMER =
  'All data is static mockup content. No stock deduction, no write-back to Express, no Supabase connection.';
