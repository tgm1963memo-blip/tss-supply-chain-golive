import { useState } from 'react';
import { ReportPreviewModal } from './ReportPreviewModal.jsx';

export function ReportPrintActions({
  title,
  renderReport,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="operational-report-actions no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          className="btn btn-primary-gold"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Preview Report
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => window.print());
          }}
        >
          Print Report
        </button>
      </div>
      <ReportPreviewModal
        open={open}
        title={title}
        onClose={() => setOpen(false)}
      >
        {renderReport()}
      </ReportPreviewModal>
    </>
  );
}
