"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, CloudLightning, ExternalLink } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

interface CloudIncident {
  id: string;
  provider: "GCP" | "AWS" | "Azure";
  title: string;
  status: string;
  severity: string;
  affectedServices: string[];
  startedAt: string;
  updatedAt: string;
  url: string;
}

export default function AlertsPage() {
  const { alerts, setAlerts } = useData();
  const [incidents, setIncidents] = useState<CloudIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  useEffect(() => {
    // Fetch aggregated Cloud Status (GCP & AWS free public status APIs)
    fetch("/api/cloud-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.incidents && Array.isArray(data.incidents)) {
          setIncidents(data.incidents.slice(0, 5)); // Show top 5 recent status reports
        }
      })
      .catch((err) => console.error("Failed to fetch cloud status", err))
      .finally(() => setLoadingIncidents(false));
  }, []);

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Alerts &amp; Notifications</h1>
          <p>Realtime alert feed, acknowledgement workflow, suppression rules, and cloud incident feeds.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
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
      
      {/* Live Global Cloud Provider Status Section */}
      <section className="panel" style={{ borderLeft: "4px solid var(--primary)" }}>
        <div className="section-head">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CloudLightning size={18} style={{ color: "var(--warning)" }} /> Global Cloud Provider Incident Feed (AWS &amp; GCP)
          </h2>
          <span style={{ fontSize: "12px", color: "var(--faint)" }}>Live feed via public status APIs</span>
        </div>

        {loadingIncidents ? (
          <div style={{ padding: "12px 0", color: "var(--faint)", fontSize: "13px" }}>Loading global cloud status…</div>
        ) : incidents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {incidents.map((incident) => (
              <div 
                key={incident.id} 
                style={{ 
                  padding: "10px 14px", 
                  background: "var(--bg-secondary)", 
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  border: "1px solid var(--line)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ 
                    padding: "2px 8px", 
                    borderRadius: "4px", 
                    fontSize: "11px", 
                    fontWeight: 700, 
                    background: incident.provider === "AWS" ? "#ff990033" : "#4285f433",
                    color: incident.provider === "AWS" ? "#ff9900" : "#4285f4",
                    border: `1px solid ${incident.provider === "AWS" ? "#ff990066" : "#4285f466"}`
                  }}>
                    {incident.provider}
                  </span>
                  <strong style={{ fontSize: "13px" }}>{incident.title}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                  <StatusBadge value={incident.status} />
                  {incident.url && (
                    <a 
                      href={incident.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                    >
                      Details <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "12px 0", color: "var(--success)", fontSize: "13px" }}>All AWS &amp; GCP cloud provider services operating normally.</div>
        )}
      </section>

      <section className="image-band alerts-band" style={{ marginTop: "16px" }}>
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
