import { forwardRef } from "react";

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent-hover disabled:bg-muted",
    secondary:
      "border border-line bg-surface text-ink hover:bg-canvas disabled:text-muted",
    danger:
      "bg-danger text-white hover:bg-rose-900 disabled:bg-muted",
    ghost:
      "text-muted hover:bg-canvas hover:text-ink disabled:text-line",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
