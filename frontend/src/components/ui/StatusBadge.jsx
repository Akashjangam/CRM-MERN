const tones = {
  Open: "border-line bg-canvas text-ink",
  "In Progress": "border-amber-200 bg-amber-50 text-amber-900",
  Closed: "border-emerald-200 bg-emerald-50 text-ok",
  Low: "border-line bg-canvas text-muted",
  Medium: "border-line bg-surface text-ink",
  High: "border-rose-200 bg-rose-50 text-danger",
};

export function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-xs font-medium ${tones[value] || tones.Open}`}
    >
      {value}
    </span>
  );
}
