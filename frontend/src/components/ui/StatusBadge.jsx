export function StatusBadge({ value }) {
  const key = String(value || "unknown").toLowerCase();
  let tone = "neutral";
  if (["active","resolved","closed","low"].includes(key)) tone = "success";
  else if (["new","open","in progress","medium","call","email","meeting","note","follow-up"].includes(key)) tone = "primary";
  else if (["pending","high"].includes(key)) tone = "warning";
  else if (["inactive","urgent"].includes(key)) tone = "danger";
  return <span className={`status-badge status-${tone}`}><span className="status-dot"/>{value || "Unknown"}</span>;
}
export default StatusBadge;

