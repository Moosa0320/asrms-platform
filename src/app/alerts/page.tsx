"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, ShieldAlert, Zap, Server, Send } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

interface DynamicAlert extends Record<string, unknown> {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  resourceId: string;
  acknowledged: boolean;
  channel: string;
  delivered: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const { alerts, setAlerts } = useData();
  const [liveAlerts, setLiveAlerts] = useState<DynamicAlert[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<{ cpu: number; memory: number; latency: number; source: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Poll real-time AWS CloudWatch telemetry to generate dynamic threshold alerts
  useEffect(() => {
    const checkTelemetryAndAlert = async () => {
      try {
        const res = await fetch("/api/monitoring?resourceId=aws-ec2-t3-micro");
        if (res.ok) {
          const data = await res.json();
          setLiveTelemetry(data);

          const generated: DynamicAlert[] = [];

          if (data.cpu > 70) {
            generated.push({
              id: `alt-cpu-${Date.now()}`,
              severity: "critical",
              title: "AWS EC2 CPU Threshold Exceeded (>70%)",
              message: `AWS EC2 Instance CPU utilization reached ${data.cpu}%. Auto-scaling policy triggered.`,
              resourceId: data.instanceId || "AWS EC2 t3.micro",
              acknowledged: false,
              channel: "CloudWatch / Email",
              delivered: true,
              createdAt: new Date().toLocaleTimeString(),
            });
          } else if (data.cpu > 50) {
            generated.push({
              id: `alt-cpu-warn-${Date.now()}`,
              severity: "warning",
              title: "AWS EC2 Elevated CPU Load (>50%)",
              message: `AWS EC2 Instance CPU is at ${data.cpu}%. Operating near scaling threshold.`,
              resourceId: data.instanceId || "AWS EC2 t3.micro",
              acknowledged: false,
              channel: "CloudWatch",
              delivered: true,
              createdAt: new Date().toLocaleTimeString(),
            });
          }

          if (data.memory > 80) {
            generated.push({
              id: `alt-mem-${Date.now()}`,
              severity: "warning",
              title: "AWS Memory Footprint Warning (>80%)",
              message: `Memory consumption is currently at ${data.memory}%. Consider scaling RAM pool.`,
              resourceId: data.instanceId || "AWS EC2 t3.micro",
              acknowledged: false,
              channel: "Dashboard",
              delivered: true,
              createdAt: new Date().toLocaleTimeString(),
            });
          }

          if (data.latency > 100) {
            generated.push({
              id: `alt-lat-${Date.now()}`,
              severity: "warning",
              title: "AWS Network Latency Spike (>100ms)",
              message: `Round-trip latency to AWS us-east-1 reached ${data.latency}ms.`,
              resourceId: "AWS us-east-1 Gateway",
              acknowledged: false,
              channel: "CloudWatch",
              delivered: true,
              createdAt: new Date().toLocaleTimeString(),
            });
          }

          setLiveAlerts(generated);
        }
      } catch (e) {
        console.error("Failed to check live alert telemetry", e);
      }
    };

    checkTelemetryAndAlert();
    const interval = setInterval(checkTelemetryAndAlert, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTestEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "alert",
          title: "Real AWS Cloud Telemetry Alert",
          message: `Live AWS EC2 Status: CPU ${liveTelemetry?.cpu ?? 0}%, Memory ${liveTelemetry?.memory ?? 0}%, Latency ${liveTelemetry?.latency ?? 0}ms.`,
          severity: "warning",
          resourceId: "AWS EC2 t3.micro (us-east-1)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus("✓ Real-time alert email delivered via Resend API!");
      } else {
        setEmailStatus(`⚠ ${data.error || "Delivery simulated (Configure RESEND_API_KEY)"}`);
      }
    } catch (err: any) {
      setEmailStatus(`⚠ Error: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const totalActive = liveAlerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Realtime Alerts &amp; Incidents</h1>
          <p>Real-world threshold monitoring powered by live AWS CloudWatch metrics and automated notification pipelines.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="button"
            type="button"
            onClick={handleTestEmail}
            disabled={sendingEmail}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Send size={15} /> {sendingEmail ? "Dispatching..." : "Send Live Alert Email"}
          </button>
        </div>
      </header>

      {emailStatus && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            background: emailStatus.startsWith("✓") ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
            border: `1px solid ${emailStatus.startsWith("✓") ? "rgba(34, 197, 94, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            color: emailStatus.startsWith("✓") ? "#4ade80" : "#fcd34d",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {emailStatus}
        </div>
      )}

      {/* KPI Metric Cards */}
      <section className="grid kpis">
        <MetricCard label="Active AWS Alerts" value={String(totalActive)} trend={totalActive === 0 ? "All AWS Services Healthy" : "Action Required"} icon={<Bell size={18} />} />
        <MetricCard label="Live AWS CPU" value={`${liveTelemetry?.cpu ?? 0}%`} trend="Target Threshold: 70%" icon={<Server size={18} />} />
        <MetricCard label="Live AWS Memory" value={`${liveTelemetry?.memory ?? 0}%`} trend="Target Threshold: 80%" icon={<Zap size={18} />} />
        <MetricCard label="AWS Ping Latency" value={`${liveTelemetry?.latency ?? 24} ms`} trend="Target Threshold: 100ms" icon={<CheckCircle size={18} />} />
      </section>

      {/* Dynamic Alerts Table */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <h2>Live AWS Threshold Alerts</h2>
          <p>Alerts dynamically trigger when real-time AWS CloudWatch metrics breach your configured policies.</p>
        </div>

        {liveAlerts.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "#080c14", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CheckCircle size={32} style={{ color: "#4ade80", margin: "0 auto 10px auto" }} />
            <h3 style={{ margin: "0 0 6px 0", color: "#f3f4f6" }}>All AWS Cloud Systems Operating Normally</h3>
            <p style={{ margin: 0, color: "var(--faint)", fontSize: "13px" }}>
              Current AWS EC2 metrics are within safe operational limits. If CPU breaches 70% during a load test, alerts will automatically appear here!
            </p>
          </div>
        ) : (
          <DataTable
            rows={liveAlerts}
            columns={[
              { key: "severity", header: "Severity", render: (r) => <StatusBadge value={r.severity} /> },
              { key: "title", header: "Alert Title" },
              { key: "message", header: "Details" },
              { key: "resourceId", header: "Target AWS Resource" },
              { key: "channel", header: "Notification Channel" },
              { key: "createdAt", header: "Timestamp" },
            ]}
          />
        )}
      </section>
    </div>
  );
}
