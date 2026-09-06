export function TextInput({ id, label, hint, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input id={id} {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextArea({ id, label, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <textarea id={id} {...props} />
    </label>
  );
}

export function Select({ id, label, children, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <select id={id} {...props}>{children}</select>
    </label>
  );
}