import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  trend,
  icon,
  breaching = false,
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  breaching?: boolean;
}) {
  return (
    <section className="metric-card">
      <div className="metric-card__icon">{icon}</div>
      <p className="metric-card__label">{label}</p>
      <strong className={`metric-card__value${breaching ? " breaching" : ""}`}>
        {value}
      </strong>
      <span className="metric-card__trend">{trend}</span>
    </section>
  );
}
