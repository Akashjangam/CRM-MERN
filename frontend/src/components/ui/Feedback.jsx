import { Button } from "./Button";

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div role="status" className="px-4 py-12 text-center">
      {Icon ? (
        <Icon className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
      ) : null}
      <h3 className="mt-3 text-sm font-medium text-ink">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-md border border-line bg-surface px-4 py-8 text-center">
      <p className="text-sm text-ink">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function FormBanner({ children }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-danger/30 bg-rose-50 px-3 py-2 text-sm text-danger"
    >
      {children}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-11 animate-pulse rounded-md bg-line/70"
        />
      ))}
    </div>
  );
}
