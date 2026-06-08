export default function DataTable({ columns, rows, emptyMessage = 'No mock data available.' }) {
  if (!rows?.length) {
    return (
      <div className="data-table-wrapper">
        <p style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
