import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  isSupabaseConfigured,
  listProductMasterRows,
} from '../../services/master-data/productMasterService.js';

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusBadge(status) {
  const text = String(status || '').toLowerCase();
  if (text.includes('active')) return <Badge type="success">Active</Badge>;
  if (text.includes('inactive') || text.includes('discontinued')) return <Badge type="neutral">Inactive</Badge>;
  return <Badge type="warning">{status || 'Unknown'}</Badge>;
}

export default function ProductMasterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProductMasterRows({
        search: searchTerm,
        productGroup: productGroup || undefined,
        activeStatus: activeStatus || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, productGroup, activeStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    loadData();
  }

  const summary = data?.summary;

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Product Master"
        description="Read-only product master from Express STMAS sync (sc_web_product_master_view / sc_express_products)."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
            <Link to="/master-data/sku-settings" className="btn btn-secondary text-sm">
              SKU Setting Requests
            </Link>
          </>
        }
      />

      <Alert variant="warning">
        Product master is read-only from Express sync. To propose SKU setting changes, use SKU Setting Requests — no Express STMAS write-back.
      </Alert>

      {!isSupabaseConfigured() ? (
        <Alert variant="info">Supabase not configured — showing seed product sample.</Alert>
      ) : null}
      {data?.source === 'seed' ? (
        <Alert variant="info">Using seed data — sync Express STMAS and apply migration 011 for sc_web_product_master_view.</Alert>
      ) : null}
      {loading ? <Alert variant="info">Loading product master...</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total Products" value={summary.totalProducts} />
          <KpiCard label="Active Products" value={summary.activeProducts} />
          <KpiCard label="Inactive Products" value={summary.inactiveProducts} />
          <KpiCard label="Product Groups" value={summary.productGroups} />
        </div>
      ) : null}

      <TablePanel title="Product List">
        <form
          onSubmit={handleFilterSubmit}
          className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4"
        >
          <select
            className="tgm-input text-sm"
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
          >
            <option value="">All Groups</option>
            {(data?.groups || []).map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <select
            className="tgm-input text-sm"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Search code, name, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Group</th>
                <th>Unit</th>
                <th>Barcode</th>
                <th>Status</th>
                <th>Synced At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((row) => (
                <tr key={row.id || row.productCode}>
                  <td className="font-mono text-brand-600">{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td>{row.productGroup || '—'}</td>
                  <td>{row.uom || '—'}</td>
                  <td className="font-mono text-xs">{row.barcode || '—'}</td>
                  <td>{statusBadge(row.activeStatus)}</td>
                  <td className="text-xs text-[var(--color-text-muted)]">{fmtDate(row.syncedAt)}</td>
                  <td>
                    <Link
                      to="/master-data/sku-settings"
                      className="text-brand-600 hover:underline"
                    >
                      Request change
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && (data?.rows || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[var(--color-text-muted)]">
                    No products match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
