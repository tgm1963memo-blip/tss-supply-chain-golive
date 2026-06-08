import { useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getCustomerMapSummary } from '../../services/customerMap/customerMapService.js';

export default function CustomerMapPage() {
  const [summary, setSummary] = useState(null);
  const [zoneFilter, setZoneFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerMapSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    if (!summary) return [];
    if (!zoneFilter) return summary.locations;
    return summary.locations.filter((l) => l.zone === zoneFilter);
  }, [summary, zoneFilter]);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Customer Map"
        description="Customer and branch planning view by province and zone. Read-only — no map SDK required."
        actions={
          <>
            <Badge type="neutral">Read-only</Badge>
            <Badge type="warning">Planning Tool</Badge>
          </>
        }
      />

      <Alert variant="info">
        Map panel is a placeholder (no paid map dependency). Use zone cards and branch table for territory planning.
        Live customer names merge from Supabase when configured.
      </Alert>

      {loading ? <Alert variant="info">Loading customer map data...</Alert> : null}

      {summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Customers" value={summary.totalCustomers} />
            <KpiCard label="Branches" value={summary.totalBranches} />
            <KpiCard label="Active Branches" value={summary.activeBranches} />
            <KpiCard label="Zones" value={summary.zones.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">By Zone</h2>
              {summary.zones.map((z) => (
                <button
                  key={z.zone}
                  type="button"
                  onClick={() => setZoneFilter(zoneFilter === z.zone ? '' : z.zone)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    zoneFilter === z.zone
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-brand-300'
                  }`}
                >
                  <div className="font-semibold">{z.zone}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {z.active} active / {z.count} branches
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-8 text-center">
              <div className="text-4xl opacity-40">🗺️</div>
              <p className="mt-3 font-medium text-[var(--color-text-main)]">Map Placeholder</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Geographic map not installed. Branch coordinates available in seed data for future integration.
              </p>
              {zoneFilter ? (
                <p className="mt-2 text-sm text-brand-700">Filtering zone: {zoneFilter}</p>
              ) : null}
            </div>
          </div>

          <TablePanel title="Customer / Branch by Province">
            <table className="tgm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Province</th>
                  <th>Zone</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((row) => (
                  <tr key={row.branchCode}>
                    <td>
                      <div className="font-mono text-xs">{row.customerCode}</div>
                      <div>{row.customerName}</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs">{row.branchCode}</div>
                      <div>{row.branchName}</div>
                    </td>
                    <td>{row.province}</td>
                    <td>{row.zone}</td>
                    <td>{row.channel}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>
        </>
      ) : null}
    </section>
  );
}
