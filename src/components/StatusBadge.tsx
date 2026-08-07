export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  return <span className={`status-badge status-${normalized}`}>{value}</span>;
}
