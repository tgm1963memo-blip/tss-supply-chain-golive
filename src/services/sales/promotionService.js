import { supabase } from '../../lib/supabaseClient.js';

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client is not configured.');
}

// -----------------------------------------------------------------------------
// CRUD Operations
// -----------------------------------------------------------------------------

export async function listPromotions() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPromotionById(id) {
  ensureSupabase();
  const { data: promotion, error: promoError } = await supabase
    .from('sc_promotions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (promoError) throw promoError;

  const { data: lines, error: linesError } = await supabase
    .from('sc_promotion_lines')
    .select('*')
    .eq('promotion_id', id)
    .order('seq_no', { ascending: true });
    
  if (linesError) throw linesError;
  
  return { ...promotion, lines };
}

export async function createPromotionDraft(payload) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotions')
    .insert([{ ...payload, status: 'draft' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromotionDraft(id, payload) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addPromotionLine(promotionId, linePayload) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotion_lines')
    .insert([{ ...linePayload, promotion_id: promotionId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromotionLine(id, linePayload) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotion_lines')
    .update({ ...linePayload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromotionLine(id) {
  ensureSupabase();
  const { error } = await supabase
    .from('sc_promotion_lines')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// -----------------------------------------------------------------------------
// Workflow Operations
// -----------------------------------------------------------------------------

async function logApprovalAction(promotionId, action, comment) {
  const { error } = await supabase
    .from('sc_promotion_approval_logs')
    .insert([{ 
      promotion_id: promotionId, 
      action, 
      action_by: 'Current User', // Stubbed for anon client context
      comment 
    }]);
  if (error) throw error;
}

async function changeStatus(id, newStatus, action, comment) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  
  await logApprovalAction(id, action, comment);
  return data;
}

export async function submitPromotion(id, comment) {
  return changeStatus(id, 'submitted', 'submitted', comment);
}

export async function approvePromotion(id, comment) {
  return changeStatus(id, 'approved', 'approved', comment);
}

export async function rejectPromotion(id, comment) {
  return changeStatus(id, 'rejected', 'rejected', comment);
}

export async function requestPromotionRevision(id, comment) {
  return changeStatus(id, 'revision_requested', 'revision_requested', comment);
}

export async function cancelPromotion(id, comment) {
  return changeStatus(id, 'cancelled', 'cancelled', comment);
}

export async function listApprovalLogs(promotionId) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotion_approval_logs')
    .select('*')
    .eq('promotion_id', promotionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listApprovalSteps(promotionId) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_promotion_approval_steps')
    .select('*')
    .eq('promotion_id', promotionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
