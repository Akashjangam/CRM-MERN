export function Field({
  id,
  label,
  error,
  children,
  hint,
  hideLabel = false,
}) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "block text-sm font-medium text-ink"}
      >
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent";

export function TextInput({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {({ id: fieldId, describedBy, invalid }) => (
        <input
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${controlClass} ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {({ id: fieldId, describedBy, invalid }) => (
        <textarea
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${controlClass} min-h-24 resize-y ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}

export function Select({
  id,
  label,
  error,
  hint,
  hideLabel,
  children,
  className = "",
  ...props
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint} hideLabel={hideLabel}>
      {({ id: fieldId, describedBy, invalid }) => (
        <select
          id={fieldId}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${controlClass} ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
