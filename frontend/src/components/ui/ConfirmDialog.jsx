export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onCancel, onConfirm }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}><div className="confirm-dialog" role="dialog" aria-modal="true"><div className="confirm-content"><div className={`confirm-icon ${danger ? "confirm-danger" : ""}`}>!</div><div><h2>{title}</h2><p>{message}</p></div></div><div className="confirm-actions"><button className="button button-secondary" onClick={onCancel}>Cancel</button><button className={`button ${danger ? "button-danger" : "button-primary"}`} onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}
export default ConfirmDialog;

