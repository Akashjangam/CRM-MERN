import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="empty-state"><div className="empty-icon empty-icon-danger"><AlertCircle size={22}/></div><h3>Something went wrong</h3><p>{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}><RefreshCw size={15}/> Try again</Button>}</div>;
}

export function SkeletonRows({ count = 6 }) {
  return <div className="skeleton-list" aria-busy="true">{Array.from({length: count}, (_, i) => <div className="skeleton-row" key={i}><span/><span/><span/></div>)}</div>;
}

