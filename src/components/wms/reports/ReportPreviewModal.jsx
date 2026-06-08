import { useEffect } from 'react';

export function ReportPreviewModal({
  open = false,
  title,
  onClose,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="operational-report-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="operational-report-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="operational-report-modal__toolbar no-print">
          <h3>{title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => window.print()}>Print</button>
            <button type="button" className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="operational-report-modal__body">{children}</div>
      </div>
    </div>
  );
}
