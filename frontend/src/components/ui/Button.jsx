export function Button({ variant = "primary", size = "", children, className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${size === "sm" ? "btn-small" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}