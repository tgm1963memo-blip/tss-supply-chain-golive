import { useEffect, useMemo, useState } from 'react';
import { listInventoryBalances } from '../../services/inventory/inventoryService.js';
import {
  createReservation,
  getReservationById,
  listReservations,
  resolveReservationIdempotencyKey,
} from '../../services/planning/reservationService.js';
import {
  isSupabaseConfigured,
  listSalesOrderFulfillmentLocationCandidates,
  listSalesOrderReservationCandidates,
} from '../../services/sales/reservationSourceService.js';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import PageSubnav from '../../components/scm-ui/PageSubnav.jsx';

const SAFE_MODE = true;

const STATUS_OPTIONS = ['', 'draft', 'active', 'partially_released', 'released', 'cancelled', 'expired'];

const INITIAL_FILTERS = {
  status: '',
  documentNo: '',
  productCode: '',
};

const INITIAL_CANDIDATE_FILTERS = {
  roomCode: 'TSS',
  documentNo: '',
  productCode: '',
  customerCode: '',
  reservationExists: '',
};

const INITIAL_FULFILLMENT_FILTERS = {
  roomCode: 'TSS',
  documentNo: '',
  productCode: '',
  customerCode: '',
  warehouseCode: '',
  locationCode: '',
  canReserve: '',
  reservationExists: '',
};

function createBlankLine() {
  return {
    clientId: crypto.randomUUID(),
    productCode: '',
    requestedQty: '',
    warehouseCode: '',
    locationCode: '',
  };
}

const INITIAL_FORM = {
  roomCode: 'TSS',
  sourceModule: '',
  sourceDocumentType: '',
  sourceDocumentNo: '',
  sourceDocumentLineRef: '',
  lines: [createBlankLine()],
};

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function makeLineAvailabilityKey(line) {
  return [
    line.productCode.trim(),
    line.warehouseCode.trim(),
    line.locationCode.trim(),
  ].join('|');
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-main)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-[var(--color-bg)] disabled:text-[var(--color-text-muted)]"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-main)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
    />
  );
}

export default function ReservationWorkbenchPage() {
  const supabaseReady = isSupabaseConfigured();
  const [reservations, setReservations] = useState([]);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [selectedReservationDetail, setSelectedReservationDetail] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState(INITIAL_FILTERS);
  const [candidateFilters, setCandidateFilters] = useState(INITIAL_CANDIDATE_FILTERS);
  const [submittedCandidateFilters, setSubmittedCandidateFilters] = useState(INITIAL_CANDIDATE_FILTERS);
  const [fulfillmentFilters, setFulfillmentFilters] = useState(INITIAL_FULFILLMENT_FILTERS);
  const [submittedFulfillmentFilters, setSubmittedFulfillmentFilters] = useState(INITIAL_FULFILLMENT_FILTERS);
  const [salesOrderCandidates, setSalesOrderCandidates] = useState([]);
  const [fulfillmentLocationCandidates, setFulfillmentLocationCandidates] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [availabilityByLineKey, setAvailabilityByLineKey] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isLoadingFulfillmentCandidates, setIsLoadingFulfillmentCandidates] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [error, setError] = useState(null);
  const [candidateError, setCandidateError] = useState(null);
  const [fulfillmentCandidateError, setFulfillmentCandidateError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState("so-candidates");

  const selectedReservation = useMemo(
    () => (
      selectedReservationDetail
      || reservations.find((reservation) => reservation.id === selectedReservationId)
      || reservations[0]
      || null
    ),
    [reservations, selectedReservationDetail, selectedReservationId],
  );

  const idempotencyKey = useMemo(() => {
    try {
      return resolveReservationIdempotencyKey({
        roomCode: form.roomCode,
        sourceModule: form.sourceModule,
        sourceDocumentType: form.sourceDocumentType,
        sourceDocumentNo: form.sourceDocumentNo,
      });
    } catch {
      return '';
    }
  }, [form.roomCode, form.sourceModule, form.sourceDocumentType, form.sourceDocumentNo]);

  const preparedLines = useMemo(
    () => form.lines.map((line) => {
      const requestedQty = Number(line.requestedQty || 0);
      const availability = availabilityByLineKey[makeLineAvailabilityKey(line)];
      return {
        ...line,
        requestedQty,
        availableQty: availability?.availableQty ?? 0,
        isChecking: availability?.isChecking || false,
      };
    }),
    [availabilityByLineKey, form.lines],
  );

  const requestedQtyByLineKey = useMemo(
    () => preparedLines.reduce((totals, line) => {
      const key = makeLineAvailabilityKey(line);
      return {
        ...totals,
        [key]: (totals[key] || 0) + line.requestedQty,
      };
    }, {}),
    [preparedLines],
  );

  const totalRequestedQty = preparedLines.reduce((total, line) => total + line.requestedQty, 0);
  const totalAvailableQty = preparedLines.reduce((total, line) => total + line.availableQty, 0);
  const hasValidLines = preparedLines.length > 0 && preparedLines.every((line) => (
    line.productCode.trim()
    && line.warehouseCode.trim()
    && line.requestedQty > 0
    && line.requestedQty <= line.availableQty
    && requestedQtyByLineKey[makeLineAvailabilityKey(line)] <= line.availableQty
  ));

  const canSubmit = Boolean(
    form.roomCode.trim()
      && form.sourceModule.trim()
      && form.sourceDocumentType.trim()
      && form.sourceDocumentNo.trim()
      && idempotencyKey
      && hasValidLines
      && !isSubmitting
      && !isCheckingStock,
  );

  function canPrepareReservationDraft(candidate) {
    return Boolean(
      candidate.canReserve
        && !candidate.reservationExists
        && candidate.candidateRequestedQty > 0
        && candidate.warehouseCode
        && candidate.locationCode
        && candidate.shortageQty <= 0
        && candidate.idempotencyKeyPreview,
    );
  }

  async function loadReservations(nextFilters = submittedFilters) {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await listReservations({
        status: nextFilters.status,
        documentNo: nextFilters.documentNo,
        productCode: nextFilters.productCode,
      });
      setReservations(rows);
      setSelectedReservationDetail(null);
      setSelectedReservationId((currentId) => (
        rows.some((reservation) => reservation.id === currentId) ? currentId : rows[0]?.id || null
      ));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSalesOrderCandidates(nextFilters = submittedCandidateFilters) {
    setIsLoadingCandidates(true);
    setCandidateError(null);

    try {
      const rows = await listSalesOrderReservationCandidates({
        roomCode: nextFilters.roomCode.trim(),
        documentNo: nextFilters.documentNo,
        productCode: nextFilters.productCode,
        customerCode: nextFilters.customerCode,
        reservationExists: nextFilters.reservationExists === ""
          ? undefined
          : nextFilters.reservationExists === "yes",
      });
      setSalesOrderCandidates(rows);
    } catch (err) {
      setCandidateError(err);
    } finally {
      setIsLoadingCandidates(false);
    }
  }

  async function loadFulfillmentLocationCandidates(nextFilters = submittedFulfillmentFilters) {
    setIsLoadingFulfillmentCandidates(true);
    setFulfillmentCandidateError(null);

    try {
      const rows = await listSalesOrderFulfillmentLocationCandidates({
        roomCode: nextFilters.roomCode.trim(),
        documentNo: nextFilters.documentNo,
        productCode: nextFilters.productCode,
        customerCode: nextFilters.customerCode,
        warehouseCode: nextFilters.warehouseCode,
        locationCode: nextFilters.locationCode,
        canReserve: nextFilters.canReserve === "" ? undefined : nextFilters.canReserve === "yes",
        reservationExists: nextFilters.reservationExists === ""
          ? undefined
          : nextFilters.reservationExists === "yes",
      });
      setFulfillmentLocationCandidates(rows);
    } catch (err) {
      setFulfillmentCandidateError(err);
    } finally {
      setIsLoadingFulfillmentCandidates(false);
    }
  }

  async function checkAvailableStock(nextForm = form) {
    const uniqueLines = new Map();
    nextForm.lines.forEach((line) => {
      if (nextForm.roomCode.trim() && line.productCode.trim() && line.warehouseCode.trim()) {
        uniqueLines.set(makeLineAvailabilityKey(line), line);
      }
    });

    if (uniqueLines.size === 0) {
      setAvailabilityByLineKey({});
      return;
    }

    setIsCheckingStock(true);
    setFormError(null);
    setAvailabilityByLineKey((current) => {
      const next = { ...current };
      uniqueLines.forEach((line, key) => {
        next[key] = { ...(next[key] || {}), isChecking: true };
      });
      return next;
    });

    try {
      const entries = await Promise.all([...uniqueLines.entries()].map(async ([key, line]) => {
        const rows = await listInventoryBalances({
          roomCode: nextForm.roomCode.trim(),
          productCode: line.productCode.trim(),
          warehouseCode: line.warehouseCode.trim(),
          locationCode: line.locationCode.trim(),
          limit: 200,
        });
        return [key, {
          availableQty: rows.reduce((total, row) => total + Number(row.availableQty || 0), 0),
          isChecking: false,
        }];
      }));
      setAvailabilityByLineKey(Object.fromEntries(entries));
    } catch (err) {
      setFormError(err.message || "Unable to check available stock.");
      setAvailabilityByLineKey((current) => {
        const next = { ...current };
        uniqueLines.forEach((line, key) => {
          next[key] = { availableQty: 0, isChecking: false };
        });
        return next;
      });
    } finally {
      setIsCheckingStock(false);
    }
  }

  useEffect(() => {
    if (!supabaseReady) {
      setReservations([]);
      setSelectedReservationId(null);
      setSelectedReservationDetail(null);
      setSalesOrderCandidates([]);
      setFulfillmentLocationCandidates([]);
      setIsLoading(false);
      setIsLoadingCandidates(false);
      setIsLoadingFulfillmentCandidates(false);
      setError(supabaseReady ? null : new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'));
      setCandidateError(null);
      setFulfillmentCandidateError(null);
      return;
    }

    loadReservations(INITIAL_FILTERS);
    loadSalesOrderCandidates(INITIAL_CANDIDATE_FILTERS);
    loadFulfillmentLocationCandidates(INITIAL_FULFILLMENT_FILTERS);
  }, [supabaseReady]);

  useEffect(() => {
    if (!supabaseReady || !selectedReservationId) {
      setSelectedReservationDetail(null);
      return;
    }

    let isCurrent = true;

    async function loadReservationDetail() {
      try {
        const detail = await getReservationById(selectedReservationId);
        if (isCurrent) {
          setSelectedReservationDetail(detail);
        }
      } catch (err) {
        if (isCurrent) {
          setSelectedReservationDetail(null);
          setError(err);
        }
      }
    }

    loadReservationDetail();

    return () => {
      isCurrent = false;
    };
  }, [supabaseReady, selectedReservationId]);

  useEffect(() => {
    if (!supabaseReady) {
      setAvailabilityByLineKey({});
      return undefined;
    }

    const timer = window.setTimeout(() => {
      checkAvailableStock(form);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [supabaseReady, form.roomCode, JSON.stringify(form.lines)]);

  function updateForm(field, value) {
    setNotice(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLine(clientId, field, value) {
    setNotice(null);
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (
        line.clientId === clientId ? { ...line, [field]: value } : line
      )),
    }));
  }

  function addLine() {
    setForm((current) => ({ ...current, lines: [...current.lines, createBlankLine()] }));
  }

  function removeLine(clientId) {
    setForm((current) => ({
      ...current,
      lines: current.lines.length === 1
        ? current.lines
        : current.lines.filter((line) => line.clientId !== clientId),
    }));
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function updateCandidateFilter(field, value) {
    setCandidateFilters((current) => ({ ...current, [field]: value }));
  }

  function updateFulfillmentFilter(field, value) {
    setFulfillmentFilters((current) => ({ ...current, [field]: value }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    setSubmittedFilters(filters);
    loadReservations(filters);
  }

  function handleCandidateFilterSubmit(event) {
    event.preventDefault();
    setSubmittedCandidateFilters(candidateFilters);
    loadSalesOrderCandidates(candidateFilters);
  }

  function handleFulfillmentFilterSubmit(event) {
    event.preventDefault();
    setSubmittedFulfillmentFilters(fulfillmentFilters);
    loadFulfillmentLocationCandidates(fulfillmentFilters);
  }

  function handlePrepareReservationDraft(candidate) {
    setFormError(null);
    setError(null);

    if (candidate.reservationExists) {
      setFormError("This Sales Order candidate already has a reservation.");
      return;
    }

    if (!candidate.canReserve || candidate.shortageQty > 0) {
      setFormError("This Sales Order candidate does not have enough available stock at the selected location.");
      return;
    }

    if (!candidate.warehouseCode || !candidate.locationCode) {
      setFormError("Select a candidate with warehouse and location before preparing a draft.");
      return;
    }

    if (candidate.candidateRequestedQty <= 0) {
      setFormError("Candidate requested quantity must be greater than zero.");
      return;
    }

    if (!candidate.idempotencyKeyPreview) {
      setFormError("Candidate is missing an idempotency key preview.");
      return;
    }

    const draftLine = {
      clientId: crypto.randomUUID(),
      productCode: candidate.productCode,
      requestedQty: String(candidate.candidateRequestedQty),
      warehouseCode: candidate.warehouseCode,
      locationCode: candidate.locationCode,
    };

    setForm({
      roomCode: candidate.roomCode,
      sourceModule: 'sales',
      sourceDocumentType: 'sales_order',
      sourceDocumentNo: candidate.sourceDocumentNo || candidate.documentNo,
      sourceDocumentLineRef: candidate.sourceDocumentLineRef || '',
      lines: [draftLine],
    });
    setAvailabilityByLineKey({
      [makeLineAvailabilityKey(draftLine)]: {
        availableQty: candidate.totalAvailableQty,
        isChecking: false,
      },
    });
    setNotice(`Draft prepared from SO ${candidate.documentNo} line ${candidate.lineNo ?? '-'}. Review the form before creating the reservation.`);
    setActiveTab("create");
  }

  async function handleCreateReservation(event) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    if (!canSubmit) {
      setFormError("Complete every line and confirm requested quantities are within available stock.");
      return;
    }

    setIsSubmitting(true);

    try {
      const reservationId = await createReservation({
        roomCode: form.roomCode.trim(),
        documentNo: form.sourceDocumentNo.trim(),
        documentType: form.sourceDocumentType.trim(),
        sourceModule: form.sourceModule.trim(),
        sourceDocumentType: form.sourceDocumentType.trim(),
        sourceDocumentNo: form.sourceDocumentNo.trim(),
        sourceDocumentLineRef: form.sourceDocumentLineRef.trim(),
        idempotencyKey,
        lines: preparedLines.map((line) => ({
          productCode: line.productCode.trim(),
          warehouseCode: line.warehouseCode.trim(),
          locationCode: line.locationCode.trim(),
          requestedQty: line.requestedQty,
        })),
      });

      setNotice(`Reservation saved after review: ${reservationId}`);
      setForm((current) => ({ ...INITIAL_FORM, roomCode: current.roomCode, lines: [createBlankLine()] }));
      setAvailabilityByLineKey({});
      await loadReservations(submittedFilters);
      await loadSalesOrderCandidates(submittedCandidateFilters);
      await loadFulfillmentLocationCandidates(submittedFulfillmentFilters);
      setSelectedReservationId(reservationId);
      setActiveTab("details");
    } catch (err) {
      setFormError(err.message || "Unable to create reservation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReleaseReservation() {
    setError(new Error('Release reservation is disabled in safe mode for go-live.'));
  }

  return (
    <section className="tgm-page space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-main)]">Reservation Workbench</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Product, warehouse, and location reservations backed by Supabase RPC validation.
          </p>
          {SAFE_MODE ? (
            <p className="mt-1 text-xs text-amber-700">
              Safe mode: create reservation enabled; release disabled until governance sign-off.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => loadReservations(submittedFilters)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm transition hover:bg-[var(--color-bg)]"
        >
          Refresh
        </button>
      </div>

      <PageSubnav
        items={[
          { id: 'so-candidates', label: 'SO Candidates' },
          { id: 'fulfillment', label: 'Fulfillment' },
          { id: 'create', label: 'Create Reservation' },
          { id: 'details', label: 'Detail' }
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error.message || 'Unable to load reservations.'}
        </div>
      ) : null}

      <div className={activeTab === 'so-candidates' ? 'block' : 'hidden'}>
        <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-main)]">Sales order candidates</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Preview source lines from Sales Orders before reservation creation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadSalesOrderCandidates(submittedCandidateFilters)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm transition hover:bg-[var(--color-bg)]"
          >
            Refresh candidates
          </button>
        </div>

        {candidateError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {candidateError.message || 'Unable to load sales order candidates.'}
          </div>
        ) : null}

        <form onSubmit={handleCandidateFilterSubmit} className="grid gap-3 md:grid-cols-[120px_1fr_1fr_1fr_160px_auto]">
          <TextInput
            value={candidateFilters.roomCode}
            onChange={(event) => updateCandidateFilter('roomCode', event.target.value)}
            placeholder="Room"
          />
          <TextInput
            type="search"
            value={candidateFilters.documentNo}
            onChange={(event) => updateCandidateFilter('documentNo', event.target.value)}
            placeholder="SO document"
          />
          <TextInput
            type="search"
            value={candidateFilters.productCode}
            onChange={(event) => updateCandidateFilter('productCode', event.target.value)}
            placeholder="Product"
          />
          <TextInput
            type="search"
            value={candidateFilters.customerCode}
            onChange={(event) => updateCandidateFilter('customerCode', event.target.value)}
            placeholder="Customer"
          />
          <SelectInput
            value={candidateFilters.reservationExists}
            onChange={(event) => updateCandidateFilter('reservationExists', event.target.value)}
          >
            <option value="">All candidates</option>
            <option value="no">Not reserved</option>
            <option value="yes">Reserved</option>
          </SelectInput>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[#121826] shadow-sm hover:bg-[var(--color-primary-hover)]"
          >
            Search
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-bg)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3">SO</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">WH / LOC</th>
                  <th className="px-4 py-3">Reservation</th>
                  <th className="px-4 py-3">Idempotency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
                {isLoadingCandidates ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading candidates...</td>
                  </tr>
                ) : null}
                {!isLoadingCandidates && salesOrderCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No sales order candidates found.</td>
                  </tr>
                ) : null}
                {!isLoadingCandidates && salesOrderCandidates.map((candidate) => (
                  <tr key={`${candidate.roomCode}:${candidate.documentNo}:${candidate.lineNo ?? ''}`}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-mono font-semibold text-[var(--color-text-main)]">{candidate.documentNo}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Line {candidate.lineNo ?? '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{candidate.customerCode || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <div>{candidate.documentDate || '-'}</div>
                      <div className="text-[var(--color-text-muted)]">{candidate.deliveryDate || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{candidate.productCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-semibold text-[var(--color-text-main)]">{formatQty(candidate.candidateRequestedQty)}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Ordered {formatQty(candidate.orderedQty)}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {(candidate.warehouseCode || '-')}/{(candidate.locationCode || '-')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {candidate.reservationExists ? (
                        <StatusBadge status={candidate.reservationStatus} />
                      ) : (
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">None</span>
                      )}
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                      {candidate.idempotencyKeyPreview}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      <div className={activeTab === 'fulfillment' ? 'block' : 'hidden'}>
        <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-main)]">Fulfillment location candidates</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Read-only availability suggestions by product, warehouse, and location.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadFulfillmentLocationCandidates(submittedFulfillmentFilters)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] shadow-sm hover:bg-[var(--color-bg)]"
          >
            Refresh locations
          </button>
        </div>

        {fulfillmentCandidateError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {fulfillmentCandidateError.message || 'Unable to load fulfillment location candidates.'}
          </div>
        ) : null}

        <form onSubmit={handleFulfillmentFilterSubmit} className="grid gap-3 lg:grid-cols-[100px_1fr_1fr_1fr_120px_120px_140px_150px_auto]">
          <TextInput
            value={fulfillmentFilters.roomCode}
            onChange={(event) => updateFulfillmentFilter('roomCode', event.target.value)}
            placeholder="Room"
          />
          <TextInput
            type="search"
            value={fulfillmentFilters.documentNo}
            onChange={(event) => updateFulfillmentFilter('documentNo', event.target.value)}
            placeholder="SO"
          />
          <TextInput
            type="search"
            value={fulfillmentFilters.productCode}
            onChange={(event) => updateFulfillmentFilter('productCode', event.target.value)}
            placeholder="Product"
          />
          <TextInput
            type="search"
            value={fulfillmentFilters.customerCode}
            onChange={(event) => updateFulfillmentFilter('customerCode', event.target.value)}
            placeholder="Customer"
          />
          <TextInput
            value={fulfillmentFilters.warehouseCode}
            onChange={(event) => updateFulfillmentFilter('warehouseCode', event.target.value)}
            placeholder="WH"
          />
          <TextInput
            value={fulfillmentFilters.locationCode}
            onChange={(event) => updateFulfillmentFilter('locationCode', event.target.value)}
            placeholder="LOC"
          />
          <SelectInput
            value={fulfillmentFilters.canReserve}
            onChange={(event) => updateFulfillmentFilter('canReserve', event.target.value)}
          >
            <option value="">Can reserve?</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </SelectInput>
          <SelectInput
            value={fulfillmentFilters.reservationExists}
            onChange={(event) => updateFulfillmentFilter('reservationExists', event.target.value)}
          >
            <option value="">Reserved?</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectInput>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[#121826] shadow-sm hover:bg-[var(--color-primary-hover)]"
          >
            Search
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-bg)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3">SO / Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Requested</th>
                  <th className="px-4 py-3">WH / LOC</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
                {isLoadingFulfillmentCandidates ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading fulfillment candidates...</td>
                  </tr>
                ) : null}
                {!isLoadingFulfillmentCandidates && fulfillmentLocationCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No fulfillment locations found.</td>
                  </tr>
                ) : null}
                {!isLoadingFulfillmentCandidates && fulfillmentLocationCandidates.map((candidate) => (
                  <tr key={`${candidate.roomCode}:${candidate.documentNo}:${candidate.lineNo ?? ''}:${candidate.warehouseCode}:${candidate.locationCode}`}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-mono font-semibold text-[var(--color-text-main)]">{candidate.documentNo}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Line {candidate.lineNo ?? '-'} / {candidate.customerCode || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-[var(--color-text-main)]">{candidate.productCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-[var(--color-text-main)]">{formatQty(candidate.candidateRequestedQty)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-semibold text-[var(--color-text-main)]">{candidate.warehouseCode || '-'}</span>
                      <span className="mx-1 text-[var(--color-text-muted)]">/</span>
                      <span className="font-semibold text-[var(--color-text-main)]">{candidate.locationCode || '-'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className={candidate.shortageQty > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                        {formatQty(candidate.totalAvailableQty)}
                      </div>
                      {candidate.shortageQty > 0 && (
                        <div className="text-xs text-rose-500">Short {formatQty(candidate.shortageQty)}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {candidate.reservationExists ? (
                        <StatusBadge status={candidate.reservationStatus} />
                      ) : candidate.canReserve ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Available</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">Unavailable</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {canPrepareReservationDraft(candidate) ? (
                        <button
                          type="button"
                          onClick={() => {
                            handlePrepareReservationDraft(candidate);
                            setActiveTab('create');
                          }}
                          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-main)] hover:bg-[var(--color-bg)] transition"
                        >
                          Prepare Reservation Draft
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      <div className={activeTab === 'create' ? 'block' : 'hidden'}>
        <form onSubmit={handleCreateReservation} className="space-y-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-main)]">Create reservation</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Reservation line granularity is product + warehouse + location.</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm hover:bg-[var(--color-bg)] transition"
            >
              Add line
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Room code">
              <TextInput value={form.roomCode} onChange={(event) => updateForm('roomCode', event.target.value)} />
            </Field>
            <Field label="Source module">
              <TextInput value={form.sourceModule} onChange={(event) => updateForm('sourceModule', event.target.value)} placeholder="SO, CONSI, SAMPLE" />
            </Field>
            <Field label="Source document type">
              <TextInput value={form.sourceDocumentType} onChange={(event) => updateForm('sourceDocumentType', event.target.value)} placeholder="SO" />
            </Field>
            <Field label="Source document no">
              <TextInput value={form.sourceDocumentNo} onChange={(event) => updateForm('sourceDocumentNo', event.target.value)} />
            </Field>
            <Field label="Source document line ref">
              <TextInput value={form.sourceDocumentLineRef} onChange={(event) => updateForm('sourceDocumentLineRef', event.target.value)} placeholder="(Optional) e.g. Line 1" />
            </Field>
          </div>

          <div className="space-y-3">
            {preparedLines.map((line, index) => {
              const overAvailable = line.requestedQty > line.availableQty;
              const groupedRequestedQty = requestedQtyByLineKey[makeLineAvailabilityKey(line)] || 0;
              const groupOverAvailable = groupedRequestedQty > line.availableQty;
              return (
                <div key={line.clientId} className="rounded-md border border-[var(--color-border)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-[var(--color-text-main)]">Line {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeLine(line.clientId)}
                      disabled={preparedLines.length === 1}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-main)] disabled:cursor-not-allowed disabled:opacity-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Product code">
                      <TextInput value={line.productCode} onChange={(event) => updateLine(line.clientId, 'productCode', event.target.value)} />
                    </Field>
                    <Field label="Requested qty">
                      <TextInput type="number" min="0" step="0.0001" value={form.lines.find((item) => item.clientId === line.clientId)?.requestedQty || ''} onChange={(event) => updateLine(line.clientId, 'requestedQty', event.target.value)} />
                    </Field>
                    <Field label="Warehouse code">
                      <TextInput value={line.warehouseCode} onChange={(event) => updateLine(line.clientId, 'warehouseCode', event.target.value)} />
                    </Field>
                    <Field label="Location code">
                      <TextInput value={line.locationCode} onChange={(event) => updateLine(line.clientId, 'locationCode', event.target.value)} />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 rounded-md bg-[var(--color-bg)] p-3 text-sm md:grid-cols-2">
                    <span className="text-[var(--color-text-muted)]">
                      Available: <strong className="text-[var(--color-text-main)]">{line.isChecking ? 'Checking...' : formatQty(line.availableQty)}</strong>
                    </span>
                    <span className={overAvailable || groupOverAvailable ? 'text-rose-500 font-medium' : 'text-[var(--color-text-muted)]'}>
                      Requested: <strong className="text-[var(--color-text-main)]">{formatQty(line.requestedQty)}</strong>
                      {groupedRequestedQty !== line.requestedQty ? ` group ${formatQty(groupedRequestedQty)}` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Total available</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-text-main)]">
                {isCheckingStock ? 'Checking...' : formatQty(totalAvailableQty)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Total requested</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-text-main)]">{formatQty(totalRequestedQty)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Idempotency key</p>
              <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">{idempotencyKey || '-'}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[#121826] shadow-sm hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Saving...' : 'Create reservation'}
            </button>
          </div>
        </form>
      </div>

      <div className={activeTab === 'details' ? 'block' : 'hidden'}>
        <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-main)]">Reservations list</h3>
            </div>
          </div>

          <form onSubmit={handleFilterSubmit} className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
            <SelectInput value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status || 'all'} value={status}>
                  {status || 'All statuses'}
                </option>
              ))}
            </SelectInput>
            <TextInput
              type="search"
              value={filters.documentNo}
              onChange={(event) => updateFilter('documentNo', event.target.value)}
              placeholder="Document no"
            />
            <TextInput
              type="search"
              value={filters.productCode}
              onChange={(event) => updateFilter('productCode', event.target.value)}
              placeholder="Product code"
            />
            <button
              type="submit"
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm transition hover:bg-[var(--color-bg)]"
            >
              Filter
            </button>
          </form>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                  <thead className="bg-[var(--color-bg)] text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Lines</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading reservations...</td>
                      </tr>
                    ) : null}
                    {!isLoading && reservations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No reservations found.</td>
                      </tr>
                    ) : null}
                    {!isLoading && reservations.map((reservation) => {
                      const isSelected = selectedReservation?.id === reservation.id;
                      return (
                        <tr
                          key={reservation.id}
                          onClick={() => setSelectedReservationId(reservation.id)}
                          className={[
                            'cursor-pointer transition',
                            isSelected ? 'bg-brand-500/10' : 'hover:bg-[var(--color-bg)]',
                          ].join(' ')}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="font-mono font-semibold text-[var(--color-text-main)]">{reservation.documentNo}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">{reservation.documentType || '-'}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{reservation.roomCode}</td>
                          <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={reservation.status} /></td>
                          <td className="whitespace-nowrap px-4 py-3">{reservation.lines.length}</td>
                          <td className="whitespace-nowrap px-4 py-3">{reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="space-y-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              {selectedReservation ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-lg font-semibold text-[var(--color-text-main)]">{selectedReservation.documentNo}</p>
                      <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{selectedReservation.idempotencyKey || '-'}</p>
                    </div>
                    <StatusBadge status={selectedReservation.status} />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Room</dt>
                      <dd className="mt-1 font-medium text-[var(--color-text-main)]">{selectedReservation.roomCode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Type</dt>
                      <dd className="mt-1 font-medium text-[var(--color-text-main)]">{selectedReservation.documentType || '-'}</dd>
                    </div>
                  </dl>

                  <section className="border-t border-[var(--color-border)] pt-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Lines</h3>
                    <div className="mt-3 grid gap-2">
                      {selectedReservation.lines.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-muted)]">No reservation lines.</p>
                      ) : null}
                      {selectedReservation.lines.map((line) => (
                        <div key={line.id} className="rounded-md border border-[var(--color-border)] p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono font-semibold text-[var(--color-text-main)]">{line.productCode}</span>
                            <StatusBadge status={line.status} />
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                            <span>WH: {line.warehouseCode || '-'}</span>
                            <span>LOC: {line.locationCode || '-'}</span>
                            <span>Requested: {formatQty(line.requestedQty)}</span>
                            <span>Reserved: {formatQty(line.reservedQty)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <button
                    type="button"
                    disabled={SAFE_MODE || selectedReservation.status !== 'active' || isReleasing}
                    onClick={() => handleReleaseReservation(selectedReservation.id)}
                    title={SAFE_MODE ? 'Release disabled in safe mode' : undefined}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50 transition"
                  >
                    {SAFE_MODE ? 'Release disabled (safe mode)' : isReleasing ? 'Releasing...' : 'Release reservation'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Select a reservation to view lines.</p>
              )}
            </aside>
          </div>
        </section>
      </div>
    </section>
  );
}
