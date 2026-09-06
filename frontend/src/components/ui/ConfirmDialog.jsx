export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="confirm-title">{title}</h2>
            <p className="page-subtitle">{message}</p>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="form-actions">
            <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}