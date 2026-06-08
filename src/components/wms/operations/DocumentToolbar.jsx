export function DocumentToolbar({ title, onRefresh, exportDisabled = true }) {
  return (
    <section className="section-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
      <div className="document-toolbar-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn" onClick={onRefresh} style={{ background: '#f0f4f8', border: '1px solid var(--tgd-border)' }}>
          Refresh
        </button>
        <button type="button" className="btn" disabled={exportDisabled} style={{ background: '#f0f4f8', border: '1px solid var(--tgd-border)' }}>
          Preview only
        </button>
      </div>
    </section>
  );
}
