export function StatusBadge({ value }) {
  const key = String(value || "").toLowerCase();
  let tone = "neutral";
  if (["closed","resolved","low","active","completed"].includes(key)) tone = "success";
  else if (["open","medium","in progress"].includes(key)) tone = "primary";
  else if (["high","urgent","pending"].includes(key)) tone = key === "urgent" ? "danger" : "warning";
  return <span className={`badge badge-${tone}`}>{value || "Unknown"}</span>;
}