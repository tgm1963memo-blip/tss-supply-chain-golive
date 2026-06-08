import { useState, useEffect } from 'react';
import Alert from '../scm-ui/Alert.jsx';
import Badge from '../scm-ui/Badge.jsx';
import { KpiCard } from '../scm-ui/Card.jsx';
import PageHeader from '../scm-ui/PageHeader.jsx';
import StatusBadge from '../scm-ui/StatusBadge.jsx';
import TablePanel from '../scm-ui/TablePanel.jsx';
import PageSubnav from '../scm-ui/PageSubnav.jsx';
import { getOperationsExtensionModule } from '../../services/operations-preview/operationsExtensionService.js';

function FilterPill({ label }) {
  return (
    <button
      className="tgm-input min-h-10 w-full text-left text-[var(--color-text-muted)] shadow-sm"
      type="button"
    >
      {label}
    </button>
  );
}

export default function OperationsPreviewPage({ previewKey, defaultTab, backPath = '/sales/overview' }) {
  const data = getOperationsExtensionModule(previewKey);
  const initialTab = defaultTab || data.tabs?.[0]?.id || 'main';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(defaultTab || data.tabs?.[0]?.id || 'main');
  }, [previewKey, defaultTab, data.tabs]);

  return (
    <section className="tgm-page">
      <PageHeader
        title={data.title}
        description={data.description}
        actions={<Badge type="neutral">{data.badge}</Badge>}
      />

      <Alert variant="warning">{data.banner}</Alert>

      <div className="grid gap-3 md:grid-cols-4">
        {data.filters.map((filter) => (
          <FilterPill key={filter} label={filter} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-5">
        {data.metrics.map(([label, value]) => (
          <KpiCard key={label} label={label} value={value} />
        ))}
      </div>

      {data.tabs && data.tabs.length > 0 && (
        <PageSubnav items={data.tabs} activeId={activeTab} onSelect={setActiveTab} />
      )}

      <TablePanel title={`${data.title} Worklist`}>
        <table className="tgm-table">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>
                    {index === 0 ? (
                      <span className="font-semibold text-[var(--color-text-main)]">{cell}</span>
                    ) : null}
                    {index !== 0 && index === data.statusIndex ? (
                      <StatusBadge status={cell} label={cell} />
                    ) : null}
                    {index !== 0 && index !== data.statusIndex ? cell : null}
                  </td>
                ))}
              </tr>
            ))}
            {data.rows.length === 0 ? (
              <tr>
                <td className="text-center text-[var(--color-text-muted)]" colSpan={data.columns.length}>
                  {data.emptyText}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
