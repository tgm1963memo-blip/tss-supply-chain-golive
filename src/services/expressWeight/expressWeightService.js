/**
 * Express Weight Write-back — DESIGN ONLY / SAFE MODE
 *
 * All functions are mock/localStorage only.
 * No Supabase insert/update, no Express DBF write-back, no queue execution.
 */

const STORAGE_KEY = 'tss_golive_express_weight_v1';
export const EXPRESS_WEIGHT_SAFE_MODE = true;

const now = () => new Date().toISOString();

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return getSeedStore();
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getSeedStore() {
  const weighedAt = '2026-06-08T10:30:00.000Z';
  return {
    captures: [
      {
        id: 'WC-001',
        soNo: 'SO-2026-004521',
        pickJobNo: 'PK-2026-001842',
        customer: 'C002 — Fresh Mart Ltd.',
        product: '10001 — ค็อกเทลซอสเซส 1000 g.',
        lot: 'LOT-2026-0612',
        qty: 1200,
        grossWeight: 1250.5,
        tareWeight: 48.0,
        netWeight: 1202.5,
        weighedBy: 'operator.demo',
        weighedAt,
        status: 'pending_review',
      },
      {
        id: 'WC-002',
        soNo: 'SO-2026-004518',
        pickJobNo: 'PK-2026-001839',
        customer: 'C001 — ABC Retail Co.',
        product: '10008 — แซนวิชแฮม 500 g.',
        lot: 'LOT-2026-0608',
        qty: 800,
        grossWeight: 412.0,
        tareWeight: 12.0,
        netWeight: 400.0,
        weighedBy: 'operator.demo',
        weighedAt: '2026-06-08T09:15:00.000Z',
        status: 'draft',
      },
    ],
    reviews: [
      {
        id: 'WR-001',
        captureId: 'WC-001',
        soNo: 'SO-2026-004521',
        product: '10001',
        systemQty: 1200,
        capturedWeight: 1202.5,
        expectedWeight: 1200,
        variance: 2.5,
        tolerancePct: 0.5,
        toleranceStatus: 'within',
        status: 'pending',
      },
      {
        id: 'WR-002',
        captureId: 'WC-003',
        soNo: 'SO-2026-004510',
        product: '10003',
        systemQty: 500,
        capturedWeight: 485.0,
        expectedWeight: 500,
        variance: -15,
        tolerancePct: 3.0,
        toleranceStatus: 'exceeded',
        status: 'pending',
      },
    ],
    queue: [
      {
        id: 'EWQ-001',
        sourceDoc: 'SO-2026-004521',
        targetExpressTable: 'OESO',
        targetField: 'NET_WEIGHT',
        oldWeight: 0,
        newWeight: 1202.5,
        status: 'Approved',
        retryCount: 0,
        lastError: '',
      },
      {
        id: 'EWQ-002',
        sourceDoc: 'SO-2026-004510',
        targetExpressTable: 'OESO',
        targetField: 'NET_WEIGHT',
        oldWeight: 500,
        newWeight: 485.0,
        status: 'Queued',
        retryCount: 0,
        lastError: '',
      },
      {
        id: 'EWQ-003',
        sourceDoc: 'SO-2026-004498',
        targetExpressTable: 'OESO',
        targetField: 'GROSS_WEIGHT',
        oldWeight: 980,
        newWeight: 975.5,
        status: 'Failed',
        retryCount: 2,
        lastError: 'Express connection timeout (design-only mock)',
      },
      {
        id: 'EWQ-004',
        sourceDoc: 'SO-2026-004480',
        targetExpressTable: 'OESO',
        targetField: 'NET_WEIGHT',
        oldWeight: 0,
        newWeight: 640.0,
        status: 'Synced',
        retryCount: 0,
        lastError: '',
      },
    ],
    syncLogs: [
      {
        id: 'LOG-001',
        queueId: 'EWQ-004',
        action: 'SYNC',
        result: 'SUCCESS',
        message: 'Design-only mock sync completed',
        syncedAt: '2026-06-07T16:45:00.000Z',
        serviceName: 'LocalSyncService (mock)',
      },
      {
        id: 'LOG-002',
        queueId: 'EWQ-003',
        action: 'SYNC',
        result: 'FAILED',
        message: 'Express connection timeout (design-only mock)',
        syncedAt: '2026-06-07T14:20:00.000Z',
        serviceName: 'LocalSyncService (mock)',
      },
      {
        id: 'LOG-003',
        queueId: 'EWQ-002',
        action: 'ENQUEUE',
        result: 'SUCCESS',
        message: 'Queued for review — no Express write executed',
        syncedAt: '2026-06-08T08:00:00.000Z',
        serviceName: 'ExpressWeightQueue (safe mode)',
      },
    ],
  };
}

function safeResponse(action, message, data = {}) {
  return {
    ok: true,
    safeMode: EXPRESS_WEIGHT_SAFE_MODE,
    action,
    message,
    expressWriteBack: false,
    timestamp: now(),
    ...data,
  };
}

export function isExpressWeightSafeMode() {
  return EXPRESS_WEIGHT_SAFE_MODE;
}

export function listWeightCaptures() {
  return loadStore().captures || [];
}

export function listWeightReviews() {
  return loadStore().reviews || [];
}

export function listWeightQueue(filters = {}) {
  let rows = loadStore().queue || [];
  if (filters.status) {
    rows = rows.filter((r) => r.status === filters.status);
  }
  return rows;
}

export function listWeightSyncLogs() {
  return [...(loadStore().syncLogs || [])].sort(
    (a, b) => new Date(b.syncedAt) - new Date(a.syncedAt),
  );
}

export function listWeightErrors() {
  return (loadStore().queue || []).filter(
    (r) => r.status === 'Failed' || (r.retryCount || 0) > 0,
  );
}

export function createWeightCaptureDraft(payload) {
  const store = loadStore();
  const record = {
    id: `WC-${Date.now().toString(36).toUpperCase()}`,
    soNo: payload.soNo || '',
    pickJobNo: payload.pickJobNo || '',
    customer: payload.customer || '',
    product: payload.product || '',
    lot: payload.lot || '',
    qty: Number(payload.qty) || 0,
    grossWeight: Number(payload.grossWeight) || 0,
    tareWeight: Number(payload.tareWeight) || 0,
    netWeight: Number(payload.netWeight) || 0,
    weighedBy: payload.weighedBy || 'operator.demo',
    weighedAt: payload.weighedAt || now(),
    status: 'draft',
  };
  store.captures = [record, ...(store.captures || [])];
  saveStore(store);
  return safeResponse('CREATE_DRAFT', 'Draft saved locally (design-only). No Express write-back.', { record });
}

export function submitWeightCaptureForReview(captureId) {
  const store = loadStore();
  const capture = store.captures?.find((c) => c.id === captureId);
  if (!capture) {
    return { ok: false, safeMode: true, message: 'Capture not found' };
  }
  capture.status = 'pending_review';
  const review = {
    id: `WR-${Date.now().toString(36).toUpperCase()}`,
    captureId: capture.id,
    soNo: capture.soNo,
    product: capture.product?.split(' — ')[0] || capture.product,
    systemQty: capture.qty,
    capturedWeight: capture.netWeight,
    expectedWeight: capture.qty,
    variance: capture.netWeight - capture.qty,
    tolerancePct: capture.qty ? Math.abs(((capture.netWeight - capture.qty) / capture.qty) * 100) : 0,
    toleranceStatus: Math.abs(capture.netWeight - capture.qty) / (capture.qty || 1) <= 0.005 ? 'within' : 'exceeded',
    status: 'pending',
  };
  store.reviews = [review, ...(store.reviews || [])];
  saveStore(store);
  return safeResponse('SUBMIT_REVIEW', 'Submitted for review (design-only). No Express write-back.', { capture, review });
}

export function approveWeightReviewSafeMode(reviewId) {
  const store = loadStore();
  const review = store.reviews?.find((r) => r.id === reviewId);
  if (!review) return { ok: false, safeMode: true, message: 'Review not found' };
  review.status = 'approved';
  saveStore(store);
  return safeResponse('APPROVE_REVIEW', 'Review approved in safe mode. No Express write-back executed.', { review });
}

export function rejectWeightReviewSafeMode(reviewId, reason = '') {
  const store = loadStore();
  const review = store.reviews?.find((r) => r.id === reviewId);
  if (!review) return { ok: false, safeMode: true, message: 'Review not found' };
  review.status = 'rejected';
  review.rejectReason = reason;
  saveStore(store);
  return safeResponse('REJECT_REVIEW', 'Review rejected in safe mode. No Express write-back.', { review });
}

export function enqueueWeightWritebackSafeMode(reviewId) {
  const store = loadStore();
  const review = store.reviews?.find((r) => r.id === reviewId);
  if (!review) return { ok: false, safeMode: true, message: 'Review not found' };
  const queueItem = {
    id: `EWQ-${Date.now().toString(36).toUpperCase()}`,
    sourceDoc: review.soNo,
    targetExpressTable: 'OESO',
    targetField: 'NET_WEIGHT',
    oldWeight: review.expectedWeight,
    newWeight: review.capturedWeight,
    status: 'Pending',
    retryCount: 0,
    lastError: '',
  };
  store.queue = [queueItem, ...(store.queue || [])];
  store.syncLogs = [
    {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      queueId: queueItem.id,
      action: 'ENQUEUE',
      result: 'SUCCESS',
      message: 'Enqueued in safe mode — no Express sync executed',
      syncedAt: now(),
      serviceName: 'ExpressWeightQueue (safe mode)',
    },
    ...(store.syncLogs || []),
  ];
  review.status = 'queued';
  saveStore(store);
  return safeResponse('ENQUEUE', 'Added to queue (design-only). Sync not executed.', { queueItem });
}

export function retryWeightWritebackSafeMode(queueId) {
  const store = loadStore();
  const item = store.queue?.find((q) => q.id === queueId);
  if (!item) return { ok: false, safeMode: true, message: 'Queue item not found' };
  item.retryCount = (item.retryCount || 0) + 1;
  item.status = 'Queued';
  item.lastError = '';
  store.syncLogs = [
    {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      queueId: item.id,
      action: 'RETRY',
      result: 'SKIPPED',
      message: 'Retry simulated in safe mode — no Express connection attempted',
      syncedAt: now(),
      serviceName: 'LocalSyncService (mock)',
    },
    ...(store.syncLogs || []),
  ];
  saveStore(store);
  return safeResponse('RETRY', 'Retry logged in safe mode. No Express write-back attempted.', { item });
}

export function cancelWeightQueueSafeMode(queueId) {
  const store = loadStore();
  const item = store.queue?.find((q) => q.id === queueId);
  if (!item) return { ok: false, safeMode: true, message: 'Queue item not found' };
  item.status = 'Cancelled';
  store.syncLogs = [
    {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      queueId: item.id,
      action: 'CANCEL',
      result: 'SUCCESS',
      message: 'Queue item cancelled in safe mode',
      syncedAt: now(),
      serviceName: 'ExpressWeightQueue (safe mode)',
    },
    ...(store.syncLogs || []),
  ];
  saveStore(store);
  return safeResponse('CANCEL', 'Queue item cancelled (design-only).', { item });
}

export function markWeightErrorReviewedSafeMode(queueId) {
  const store = loadStore();
  const item = store.queue?.find((q) => q.id === queueId);
  if (!item) return { ok: false, safeMode: true, message: 'Queue item not found' };
  item.status = 'Reviewed';
  saveStore(store);
  return safeResponse('MARK_REVIEWED', 'Marked as reviewed in safe mode.', { item });
}

export function getExpressWeightSummary() {
  const store = loadStore();
  const queue = store.queue || [];
  return {
    captures: (store.captures || []).length,
    pendingReview: (store.reviews || []).filter((r) => r.status === 'pending').length,
    queuePending: queue.filter((q) => q.status === 'Pending' || q.status === 'Queued').length,
    queueFailed: queue.filter((q) => q.status === 'Failed').length,
    queueSynced: queue.filter((q) => q.status === 'Synced').length,
  };
}
