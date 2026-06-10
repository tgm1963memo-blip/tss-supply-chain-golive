import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createSkuSettingRequest,
  isSupabaseConfigured,
  listSkuAdminProducts,
  listSkuSettingRequests,
} from '../../services/master-data/skuAdminService.js';

const INITIAL_REQUEST = {
  productCode: '',
  productName: '',
  minStock: '',
  shelfLifeDays: '',
  leadTimeDays: '',
  moq: '',
  reason: '',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SKUSettingsPage() {
  const [search, setSearch] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState(INITIAL_REQUEST);
  const [selectedSku, setSelectedSku] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productData, requestRows] = await Promise.all([
        listSkuAdminProducts({ search, productGroup: productGroup || undefined }),
        listSkuSettingRequests(),
      ]);
      setData(productData);
      setRequests(requestRows);
    } catch (err) {
      setError(err);
      setData(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, productGroup]);

  function selectSku(row) {
    setSelectedSku(row);
    setRequestForm({
      productCode: row.productCode,
      productName: row.productName,
      minStock: String(row.minStock ?? ''),
      shelfLifeDays: String(row.shelfLifeDays ?? ''),
      leadTimeDays: String(row.leadTimeDays ?? ''),
      moq: String(row.moq ?? ''),
      reason: '',
    });
  }

  function updateRequestField(field, value) {
    setRequestForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmitRequest(event) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(new Error('Supabase is not configured.'));
      return;
    }
    if (!requestForm.productCode) {
      setError(new Error('Select a SKU from the table first.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSkuSettingRequest({
        productCode: requestForm.productCode,
        productName: requestForm.productName,
        proposedChanges: {
          min_stock: Number(requestForm.minStock || 0),
          shelf_life: Number(requestForm.shelfLifeDays || 0),
          lead_time: Number(requestForm.leadTimeDays || 0),
          moq: Number(requestForm.moq || 0),
        },
        reason: requestForm.reason,
      });
      setMessage(`Request ${created.requestNo} submitted — no Express STMAS write-back.`);
      setRequestForm(INITIAL_REQUEST);
      setSelectedSku(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="SKU Settings"
        description="Legacy pgSKUAdmin — product master from Express STMAS sync; changes via request workflow only."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">REQUEST ONLY</Badge>
          </>
        }
      />

      <Alert variant="warning">
        SKU master is read from sc_web_sku_admin_view. Setting changes are stored as Supabase requests with express_queue_status = blocked_by_governance — no Express STMAS write-back.
      </Alert>

      {data?.source === 'seed' ? (
        <Alert variant="info">Using seed SKU data — sync Express STMAS for sc_web_sku_admin_view.</Alert>
      ) : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      {data?.summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="SKUs" value={data.summary.skuCount} />
          <KpiCard label="Active" value={data.summary.activeCount} />
          <KpiCard label="Product Groups" value={data.summary.groupCount} />
          <KpiCard label="Pending Requests" value={requests.filter((r) => r.status === 'submitted').length} />
        </div>
      ) : null}

      <TablePanel title="SKU Master">
        <form
          className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4"
          onSubmit={(e) => { e.preventDefault(); load(); }}
        >
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Search SKU / name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="tgm-input text-sm"
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
          >
            <option value="">All groups</option>
            {(data?.groups || []).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        {loading ? <Alert variant="info">Loading SKU master...</Alert> : null}

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Group</th>
                <th>Plant</th>
                <th>UOM</th>
                <th className="text-right">Min Stock</th>
                <th className="text-right">Shelf Life</th>
                <th className="text-right">Lead Time</th>
                <th className="text-right">MOQ</th>
                <th>Status</th>
                <th>Forecast Class</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((row) => (
                <tr
                  key={row.id || row.productCode}
                  className={selectedSku?.productCode === row.productCode ? 'bg-[var(--color-surface-muted)]' : 'cursor-pointer'}
                  onClick={() => selectSku(row)}
                >
                  <td className="font-mono">{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td>{row.productGroup}</td>
                  <td>{row.plantCode}</td>
                  <td>{row.uom}</td>
                  <td className="text-right">{fmt(row.minStock)}</td>
                  <td className="text-right">{fmt(row.shelfLifeDays)}</td>
                  <td className="text-right">{fmt(row.leadTimeDays)}</td>
                  <td className="text-right">{fmt(row.moq)}</td>
                  <td><Badge type="neutral">{row.activeStatus}</Badge></td>
                  <td>{row.forecastClass}</td>
                </tr>
              ))}
              {!loading && !(data?.rows?.length) ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[var(--color-text-muted)]">No SKU rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>

      <form
        onSubmit={handleSubmitRequest}
        className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <h3 className="md:col-span-2 font-medium">Submit SKU Setting Change Request</h3>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">SKU</span>
          <input className="tgm-input w-full font-mono" value={requestForm.productCode} readOnly />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product Name</span>
          <input className="tgm-input w-full" value={requestForm.productName} readOnly />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Min Stock (kg)</span>
          <input type="number" step="0.01" className="tgm-input w-full" value={requestForm.minStock} onChange={(e) => updateRequestField('minStock', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Shelf Life (days)</span>
          <input type="number" className="tgm-input w-full" value={requestForm.shelfLifeDays} onChange={(e) => updateRequestField('shelfLifeDays', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Lead Time (days)</span>
          <input type="number" className="tgm-input w-full" value={requestForm.leadTimeDays} onChange={(e) => updateRequestField('leadTimeDays', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">MOQ</span>
          <input type="number" step="0.01" className="tgm-input w-full" value={requestForm.moq} onChange={(e) => updateRequestField('moq', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Reason</span>
          <textarea className="tgm-input w-full" rows={2} value={requestForm.reason} onChange={(e) => updateRequestField('reason', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting || !requestForm.productCode}>
            Submit Setting Request (Blocked by Governance)
          </button>
        </div>
      </form>

      <TablePanel title="SKU Setting Requests">
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Request No</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Express Queue</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.requestNo}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                  <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                  <td>{row.reason || '—'}</td>
                </tr>
              ))}
              {!loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">No setting requests yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
