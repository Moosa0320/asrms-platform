"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, CloudLightning } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function AlertsPage() {
  const { alerts, setAlerts } = useData();
  const [gcpStatus, setGcpStatus] = useState<any[]>([]);

  useEffect(() => {
    // Fetch global GCP status (free public API)
    fetch("https://status.cloud.google.com/incidents.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGcpStatus(data.slice(0, 3)); // Only show top 3 recent incidents
        }
      })
      .catch((err) => console.error("Failed to fetch GCP status", err));
  }, []);

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Alerts & Notifications</h1>
          <p>Realtime alert feed, acknowledgement workflow, suppression rules, and delivery channels.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="button"
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "alert",
                    title: "Manual Test Alert Triggered",
                    message: "This is a real-time operational test of the ASRMS Resend Email integration. Your alert delivery pipeline is active and verified.",
                    severity: "critical",
                    metadata: {
                      Pipeline: "Resend Email Dispatcher",
                      Trigger: "Manual Console Test",
                      Recipient: "moosashahid0320@gmail.com",
                      Timestamp: new Date().toUTCString()
                    }
                  })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  alert(`✅ Alert sent successfully via ${data.provider} to ${data.recipient}!`);
                } else {
                  alert(`⚠️ Notification warning: ${data.error || 'Check Resend key'}`);
                }
              } catch (e: any) {
                alert(`❌ Error sending notification: ${e.message}`);
              }
            }}
          >
            <Bell size={16} /> Test Real Email Alert
          </button>
          <ActionButton action="configure-alerts"><Bell size={16} /> Configure Channels</ActionButton>
        </div>
      </header>
      
      {gcpStatus.length > 0 && (
        <section className="panel" style={{ borderLeft: "4px solid var(--warning)" }}>
          <div className="section-head">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudLightning size={18} /> Global Cloud Provider Incidents (GCP)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {gcpStatus.map((incident: any) => (
              <div key={incident.id} style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <strong>{incident.external_desc}</strong> - Status: <StatusBadge value={incident.status_impact || 'unknown'} />
              </div>
            ))}
          </div>
        </section>
      )}

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
