"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity, Bell, Clipboard, ClipboardCheck, Cpu, Database,
  Download, ExternalLink, Gauge, Plus, RotateCw, TerminalSquare,
  Zap, CheckCircle, AlertTriangle,
} from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAppActions } from "@/context/AppActionsContext";

// ─── Stress commands for quick-launch ────────────────────────────────────────
const STRESS_CMDS = [
  {
    id: "python60",
    label: "Python 60 s countdown stress",
    description: "Burns CPU with matrix math while showing a live countdown timer",
    cmd: `python3 -c "
import time, sys
end = time.time() + 60
while time.time() < end:
    remaining = int(end - time.time())
    sys.stdout.write(f'\\r⚡ Stressing CPU... {remaining:2d}s remaining ')
    sys.stdout.flush()
    sum(i*i for i in range(500000))
print('\\n✓ Done')
"`,
  },
  {
    id: "stress5",
    label: "stress-ng 5 min full-core test",
    description: "Requires stress-ng installed on the instance. Saturates all CPU cores for 5 minutes.",
    cmd: "stress-ng --cpu 0 --timeout 300s --metrics-brief",
  },
  {
    id: "dd",
    label: "Background CPU loop (no install needed)",
    description: "Pure bash — runs forever in the background until killed with kill %1",
    cmd: "while true; do :; done &",
  },
];

// ─── CopyButton ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy command"
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "4px 8px", borderRadius: "4px", cursor: "pointer",
        fontSize: "11px", fontFamily: "var(--font-data)",
        background: copied ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
        color: copied ? "var(--success)" : "var(--muted)",
        transition: "all 0.15s",
      }}
    >
      {copied ? <ClipboardCheck size={12} /> : <Clipboard size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { resources, scalingEvents, addScalingEvent } = useData();
  const { notifications } = useAppActions();

  const [liveTelemetry, setLiveTelemetry] = useState<{
    cpu: number; memory: number; network: number; latency: number; source?: string;
  } | null>(null);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  // Auto-Scale Engine state
  const [autoScaleEnabled, setAutoScaleEnabled] = useState(true);
  const [cpuThreshold, setCpuThreshold] = useState(70);
  const [autoScaleLog, setAutoScaleLog] = useState<
    { time: string; message: string; type: "info" | "success" | "warning" }[]
  >([]);
  const [autoScaleChecking, setAutoScaleChecking] = useState(false);
  const autoScaleRef = useRef(autoScaleEnabled);
  autoScaleRef.current = autoScaleEnabled;

  // Live telemetry polling — every 3 s
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/monitoring?resourceId=aws-ec2-t3-micro");
        if (res.ok) {
          const data = await res.json();
          setLiveTelemetry(data);
          setMetricHistory((prev) => {
            const next = [...prev, { ...data, time: new Date().toLocaleTimeString() }];
            if (next.length > 15) next.shift();
            return next;
          });
        }
      } catch { /* silent */ }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  // Autonomous Auto-Scale Engine — polls every 15 s
  useEffect(() => {
    const runCheck = async () => {
      if (!autoScaleRef.current) return;
      setAutoScaleChecking(true);
      try {
        const res = await fetch("/api/scaling/autoscale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threshold: cpuThreshold, cpu: liveTelemetry?.cpu }),
        });
        const data = await res.json();
        const time = new Date().toLocaleTimeString();

        if (data.triggered) {
          setAutoScaleLog((p) => [{ time, message: data.message, type: "success" }, ...p.slice(0, 9)]);
          addScalingEvent({
            id: `evt-auto-${Date.now()}`,
            type: "scale_up",
            resourceId: `AWS EC2 (${data.instanceId || "us-east-1"})`,
            policyId: "AWS EC2 Target CPU Policy",
            cloudProvider: "aws",
            region: "us-east-1",
            status: "success",
            reason: `Auto-Scaler: CPU ${data.cpu}% ≥ threshold ${cpuThreshold}%`,
            timestamp: time,
          });
        } else if (data.inCooldown) {
          setAutoScaleLog((p) => [{ time, message: data.message, type: "warning" }, ...p.slice(0, 9)]);
        } else {
          setAutoScaleLog((p) => [
            { time, message: `CPU ${data.cpu ?? liveTelemetry?.cpu ?? "?"}% — below threshold (${cpuThreshold}%). Standby.`, type: "info" },
            ...p.slice(0, 9),
          ]);
        }
      } catch (err: any) {
        setAutoScaleLog((p) => [{ time: new Date().toLocaleTimeString(), message: `Engine error: ${err.message}`, type: "warning" }, ...p.slice(0, 9)]);
      } finally {
        setAutoScaleChecking(false);
      }
    };
    const interval = setInterval(runCheck, 15000);
    runCheck();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpuThreshold]);

  const awsResources = resources.filter((r) => r.cloudProvider === "aws");
  const liveCpu    = liveTelemetry?.cpu     ?? 12;
  const liveMemory = liveTelemetry?.memory  ?? 52;
  const liveLatency = liveTelemetry?.latency ?? 24;
  const isCpuBreaching = liveCpu >= cpuThreshold;
  const unreadAlerts = notifications.filter((n) => !n.read).length;

  return (
    <div className="page">
      {/* Page heading */}
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Operations Center</h1>
          <p>Real-time CloudWatch telemetry and autonomous scaling engine for Amazon Web Services.</p>
        </div>
        <div className="actions">
          <span className="live-dot">AWS connected</span>
          <ActionButton action="manual-scale" className="ghost-button">
            <Gauge size={14} /> Manual Scale
          </ActionButton>
          <ActionButton action="create-policy" className="ghost-button">
            <Plus size={14} /> Policy
          </ActionButton>
          <ActionButton action="export-report">
            <Download size={14} /> Export
          </ActionButton>
        </div>
      </header>

      {/* Hero band */}
      <section className="image-band dashboard-band">
        <div>
          <h2>Autonomous Cloud Operations Surface</h2>
          <p>Live CloudWatch streams, autonomous scaling policies, and compliance telemetry in one unified platform.</p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard
          label="AWS Resources"
          value={String(awsResources.length)}
          trend="Live discovered"
          icon={<Database size={15} />}
        />
        <MetricCard
          label="Live CPU"
          value={`${liveCpu}%`}
          trend={isCpuBreaching ? "⚡ Threshold breached!" : `Threshold: ${cpuThreshold}%`}
          icon={<Cpu size={15} />}
          breaching={isCpuBreaching}
        />
        <MetricCard
          label="Memory"
          value={`${liveMemory}%`}
          trend="Within policy envelope"
          icon={<Activity size={15} />}
        />
        <MetricCard
          label="Open alerts"
          value={String(unreadAlerts)}
          trend={unreadAlerts > 0 ? "Requires attention" : "All clear"}
          icon={<Bell size={15} />}
        />
      </section>

      {/* Chart + Auto-Scale Engine */}
      <section className="grid two">

        {/* Live metric chart */}
        <div className="panel">
          <div className="section-head" style={{ marginBottom: "12px" }}>
            <div>
              <h2>Live AWS Metric Stream</h2>
              <p style={{ marginTop: "2px", fontSize: "11px" }}>
                {liveTelemetry?.source ?? "Connecting to CloudWatch…"}
              </p>
            </div>
            <StatusBadge value="active" />
          </div>
          <LiveChart data={metricHistory} keys={["cpu", "memory", "network", "latency"]} kind="area" />
        </div>

        {/* Autonomous Auto-Scale Engine */}
        <div className="panel" style={{
          borderLeft: "2px solid var(--accent-line)",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <div className="section-head">
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Zap size={15} style={{ color: "var(--warning)" }} />
              <h2>Auto-Scale Engine</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoScaleEnabled(!autoScaleEnabled);
                setAutoScaleLog((p) => [{
                  time: new Date().toLocaleTimeString(),
                  message: !autoScaleEnabled
                    ? "Engine ENABLED — monitoring every 15 s"
                    : "Engine PAUSED",
                  type: !autoScaleEnabled ? "success" : "warning",
                }, ...p.slice(0, 9)]);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "4px 10px", borderRadius: "4px", cursor: "pointer",
                fontSize: "11px", fontFamily: "var(--font-data)",
                background: autoScaleEnabled ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                border: `1px solid ${autoScaleEnabled ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                color: autoScaleEnabled ? "var(--success)" : "var(--critical)",
              }}
            >
              {autoScaleEnabled ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
              {autoScaleEnabled ? "Active" : "Paused"}
            </button>
          </div>

          {/* Threshold slider */}
          <div style={{ background: "#0E1118", borderRadius: "5px", padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>CPU threshold</span>
              <strong style={{ fontSize: "13px", fontFamily: "var(--font-data)", color: "var(--warning)" }}>{cpuThreshold}%</strong>
            </div>
            <input type="range" min={30} max={95} step={5} value={cpuThreshold}
              onChange={(e) => setCpuThreshold(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--warning)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--faint)", fontFamily: "var(--font-data)", marginTop: "3px" }}>
              <span>30% aggressive</span><span>95% conservative</span>
            </div>
          </div>

          {/* Live status row */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { label: "Live CPU", value: `${liveCpu}%`, color: isCpuBreaching ? "var(--warning)" : "var(--success)" },
              { label: "Threshold", value: `${cpuThreshold}%`, color: "var(--warning)" },
              { label: "Interval", value: autoScaleChecking ? "…" : "15 s", color: "var(--primary)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1, background: "#0E1118", padding: "8px 10px",
                borderRadius: "5px", border: "1px solid var(--border)", textAlign: "center",
              }}>
                <div style={{ fontSize: "10px", color: "var(--faint)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "17px", fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Engine activity log */}
          <div style={{
            flex: 1, background: "#0A0D14", borderRadius: "5px",
            padding: "8px 10px", border: "1px solid var(--border)",
            maxHeight: "160px", overflowY: "auto",
            fontFamily: "var(--font-data)", fontSize: "11px",
          }}>
            <div style={{ color: "var(--faint)", marginBottom: "6px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Engine log
            </div>
            {autoScaleLog.length === 0 ? (
              <span style={{ color: "var(--faint)" }}>Initializing…</span>
            ) : autoScaleLog.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
                <span style={{ color: "var(--faint)", flexShrink: 0 }}>{e.time}</span>
                <span style={{ color: e.type === "success" ? "var(--success)" : e.type === "warning" ? "var(--warning)" : "var(--faint)" }}>
                  {e.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quick-Launch Stress Commands ─── */}
      <section className="stress-panel">
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <TerminalSquare size={15} style={{ color: "var(--warning)" }} />
            <h2>Quick-Launch Load Test</h2>
          </div>
          <a
            href="https://us-east-1.console.aws.amazon.com/ec2/home#Instances"
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-button"
            style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px" }}
          >
            <ExternalLink size={12} /> Open AWS EC2 Console
          </a>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: "11px", color: "var(--faint)" }}>
          Copy any command below → paste into your EC2 SSH session → watch the Auto-Scale Engine trigger above.
        </p>
        {STRESS_CMDS.map((cmd) => (
          <div key={cmd.id} className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                {cmd.label}
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>{cmd.description}</code>
            </div>
            <CopyButton text={cmd.cmd} />
            <a
              href="https://us-east-1.console.aws.amazon.com/ec2/home#Instances"
              target="_blank"
              rel="noopener noreferrer"
              title="Open EC2 to SSH"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "28px", height: "28px", borderRadius: "4px",
                border: "1px solid var(--border)", color: "var(--faint)",
                background: "rgba(255,255,255,0.03)", flexShrink: 0,
              }}
            >
              <ExternalLink size={11} />
            </a>
          </div>
        ))}
      </section>

      {/* Scaling decisions table */}
      <section className="panel" style={{ marginTop: "2px" }}>
        <div className="section-head" style={{ marginBottom: "10px" }}>
          <div>
            <h2>Recent scaling decisions</h2>
            <p style={{ marginTop: "2px", fontSize: "11px" }}>Executed by the Auto-Scale Engine or manual operator overrides.</p>
          </div>
        </div>
        <DataTable
          rows={scalingEvents}
          columns={[
            { key: "type", header: "Decision" },
            { key: "resourceId", header: "Target resource" },
            { key: "policyId", header: "Applied policy" },
            { key: "region", header: "Region" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r.status)} /> },
            { key: "reason", header: "Trigger reason" },
            { key: "timestamp", header: "Time" },
          ]}
        />
      </section>
    </div>
  );
}
