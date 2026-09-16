import { LoaderCircle } from "lucide-react";

export function Button({ children, variant = "primary", loading = false, size = "", className = "", ...props }) {
  return (
    <button className={`button button-${variant} ${size === "sm" ? "button-small" : ""} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <LoaderCircle className="spinner" size={15} />}
      {children}
    </button>
  );
}

