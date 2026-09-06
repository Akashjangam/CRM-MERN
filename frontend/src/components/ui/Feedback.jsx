import { AlertCircle, CheckCircle2, Inbox, RefreshCw } from "lucide-react";

export function Banner({ children, type = "error" }) {
  if (!children) return null;
  return <div className={`banner banner-${type}`} role={type === "error" ? "alert" : "status"}>{children}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
        <AlertCircle size={22} />
      </div>
      <h3>Unable to load this data</h3>
      <p>{message}</p>
      {onRetry && <button className="btn btn-secondary btn-small" onClick={onRetry}><RefreshCw size={15} /> Try again</button>}
    </div>
  );
}

export function SuccessBanner({ children }) {
  return <Banner type="success"><CheckCircle2 size={15} style={{verticalAlign:"-3px", marginRight:6}} />{children}</Banner>;
}

export function SkeletonRows({ count = 5 }) {
  return <div style={{display:"grid",gap:14,padding:20}}>{Array.from({length:count}, (_,i) => <div key={i} className="skeleton" style={{width:`${70 + (i%3)*9}%`}} />)}</div>;
}