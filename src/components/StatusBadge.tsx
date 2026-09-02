export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/\s+/g, "_");

  const dotMap: Record<string, string> = {
    success: "●",
    healthy: "●",
    active: "●",
    connected: "●",
    online: "●",
    delivered: "●",
    acknowledged: "●",
    warning: "◐",
    pending: "◐",
    draft: "◐",
    critical: "✕",
    failed: "✕",
    error: "✕",
    inactive: "✕",
    offline: "✕",
  };

  const dot = dotMap[normalized] ?? "○";
  const label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

  return (
    <span className={`status-badge status-${normalized}`}>
      <span className="status-dot" aria-hidden="true">{dot}</span>
      {label}
    </span>
  );
}
