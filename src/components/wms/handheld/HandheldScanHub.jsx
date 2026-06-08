import { useState } from 'react';
import { PageHeader } from '../ui/PageHeader.jsx';

export function HandheldScanHub({ title = 'Handheld Scan Operations', description = 'Warehouse scan workflow.' }) {
  const [scanInput, setScanInput] = useState('');

  function handleScan(event) {
    event.preventDefault();
    if (!scanInput.trim()) return;
    setScanInput('');
  }

  return (
    <section className="page-shell handheld-page" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px' }}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <span
            className="production-hold-badge"
            style={{ padding: '6px 10px', background: 'var(--tgd-danger)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 13 }}
          >
            Safe Mode
          </span>
        }
      />

      <section className="section-card" style={{ marginBottom: 16, padding: 20 }}>
        <h3 style={{ marginTop: 0, color: 'var(--tgd-main-text)', fontSize: 18, marginBottom: 16 }}>Scan Barcode</h3>
        <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Scan Location, Pallet, or Lot..."
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            style={{
              padding: '16px',
              fontSize: 18,
              borderRadius: 8,
              border: '2px solid var(--tgd-border)',
              width: '100%',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
          <p style={{ color: 'var(--tgd-muted-text)', margin: 0, fontSize: 13 }}>Scan barcode or enter manually. Read-only demo — no stock movement.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <button type="button" style={{ padding: '16px', background: 'var(--tgd-surface)', border: '1px solid var(--tgd-border)', color: 'var(--tgd-main-text)', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Back / Cancel</button>
            <button type="submit" style={{ padding: '16px', background: 'var(--tgd-primary-gold)', border: 'none', color: '#000', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Scan / Enter</button>
          </div>
        </form>
      </section>

      <section className="section-card" style={{ marginBottom: 16, padding: 20, borderLeft: '4px solid var(--tgd-info)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--tgd-main-text)', fontSize: 16, marginBottom: 16 }}>Last Scan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: 14 }}>
          <div>
            <div style={{ color: 'var(--tgd-muted-text)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>Product</div>
            <div style={{ fontWeight: 600, color: 'var(--tgd-main-text)' }}>PRD-1025</div>
          </div>
          <div>
            <div style={{ color: 'var(--tgd-muted-text)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>Lot</div>
            <div style={{ fontWeight: 600, color: 'var(--tgd-main-text)' }}>L20260606</div>
          </div>
          <div>
            <div style={{ color: 'var(--tgd-muted-text)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
            <div style={{ fontWeight: 600, color: 'var(--tgd-main-text)' }}>A-01-02</div>
          </div>
          <div>
            <div style={{ color: 'var(--tgd-muted-text)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>Qty</div>
            <div style={{ fontWeight: 600, color: 'var(--tgd-info)', fontSize: 16 }}>10</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ color: 'var(--tgd-muted-text)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
            <div style={{ fontWeight: 600, color: 'var(--tgd-success)' }}>Success - Just Now</div>
          </div>
        </div>
      </section>

      <section className="section-card" style={{ marginBottom: 24, padding: 20 }}>
        <h3 style={{ marginTop: 0, color: 'var(--tgd-main-text)', fontSize: 16, marginBottom: 16 }}>Session Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
          <div style={{ background: 'var(--tgd-main-bg)', padding: '12px 8px', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgd-main-text)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--tgd-muted-text)', textTransform: 'uppercase' }}>Total Scans</div>
          </div>
          <div style={{ background: 'var(--tgd-main-bg)', padding: '12px 8px', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgd-warning)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--tgd-muted-text)', textTransform: 'uppercase' }}>Pending</div>
          </div>
          <div style={{ background: 'var(--tgd-main-bg)', padding: '12px 8px', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tgd-success)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--tgd-muted-text)', textTransform: 'uppercase' }}>Errors</div>
          </div>
        </div>
      </section>
    </section>
  );
}
