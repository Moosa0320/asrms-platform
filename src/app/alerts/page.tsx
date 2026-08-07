"use client";

import { Bell, CheckCircle } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function AlertsPage() {
  const { alerts, setAlerts } = useData();

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Alerts & Notifications</h1>
          <p>Realtime alert feed, acknowledgement workflow, suppression rules, and delivery channels.</p>
        </div>
        <ActionButton action="configure-alerts"><Bell size={16} /> Configure Channels</ActionButton>
      </header>
      <section className="image-band alerts-band">
        <div>
          <h2>Incident response cockpit</h2>
          <p>Route, acknowledge, suppress, and audit every alert from one operational queue.</p>
        </div>
      </section>
      <section className="grid kpis">
        <MetricCard label="Critical" value={String(alerts.filter((alert) => alert.severity === "critical").length)} trend="PagerDuty routed" icon={<Bell size={18} />} />
        <MetricCard label="Warnings" value={String(alerts.filter((alert) => alert.severity === "warning").length)} trend="Slack routed" icon={<Bell size={18} />} />
        <MetricCard label="Acknowledged" value={String(alerts.filter((alert) => alert.acknowledged).length)} trend="Operator tracked" icon={<CheckCircle size={18} />} />
        <MetricCard label="Delivery" value="100%" trend="Email, Slack, PagerDuty" icon={<CheckCircle size={18} />} />
      </section>
      <section className="panel">
        <DataTable
          rows={alerts}
          columns={[
            { key: "severity", header: "Severity", render: (row) => <StatusBadge value={String(row.severity)} /> },
            { key: "title", header: "Title" },
            { key: "resourceId", header: "Resource" },
            { key: "channel", header: "Channel" },
            { key: "delivered", header: "Delivered", render: (row) => <StatusBadge value={row.delivered ? "delivered" : "failed"} /> },
            {
              key: "acknowledged",
              header: "Action",
              render: (row) => row.acknowledged ? <StatusBadge value="acknowledged" /> : (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setAlerts((items) => items.map((item) => item.id === row.id ? { ...item, acknowledged: true } : item))}
                >
                  Acknowledge
                </button>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
