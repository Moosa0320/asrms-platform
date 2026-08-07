import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
}) {
  return (
    <section className="metric-card">
      <div className="metric-card__icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{trend}</span>
    </section>
  );
}
