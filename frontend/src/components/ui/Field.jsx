function Label({ label, required }) {
  return <span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>;
}

export function TextInput({ id, label, hint, error, required, ...props }) {
  return <label className="field" htmlFor={id}><Label label={label} required={required}/><input id={id} aria-invalid={Boolean(error)} required={required} {...props}/>{error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</label>;
}

export function TextArea({ id, label, hint, error, required, ...props }) {
  return <label className="field" htmlFor={id}><Label label={label} required={required}/><textarea id={id} aria-invalid={Boolean(error)} required={required} {...props}/>{error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</label>;
}

export function Select({ id, label, hint, error, required, children, ...props }) {
  return <label className="field" htmlFor={id}><Label label={label} required={required}/><select id={id} aria-invalid={Boolean(error)} required={required} {...props}>{children}</select>{error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</label>;
}

