"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Bell, Cpu, Database, Download, Gauge, Plus, Wifi, Zap, CheckCircle, AlertTriangle, RotateCw } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAppActions } from "@/context/AppActionsContext";

export default function DashboardPage() {
  const { cloudProviders, resources, scalingEvents, addScalingEvent } = useData();
  const { notifications } = useAppActions();

  const [liveTelemetry, setLiveTelemetry] = useState<{
    cpu: number; memory: number; network: number; latency: number;
    source?: string; instanceId?: string;
  } | null>(null);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  // Auto-Scale Engine state
  const [autoScaleEnabled, setAutoScaleEnabled] = useState(true);
  const [cpuThreshold, setCpuThreshold] = useState(70);
  const [autoScaleLog, setAutoScaleLog] = useState<{ time: string; message: string; type: "info" | "success" | "warning" }[]>([]);
  const [autoScaleChecking, setAutoScaleChecking] = useState(false);
  const autoScaleRef = useRef(autoScaleEnabled);
  autoScaleRef.current = autoScaleEnabled;

  // Fetch live telemetry
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
      } catch (e) { /* silent */ }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  // Autonomous Auto-Scale Engine — polls every 15 seconds
  useEffect(() => {
    const runAutoScaleCheck = async () => {
      if (!autoScaleRef.current) return;
      setAutoScaleChecking(true);
      try {
        const res = await fetch("/api/scaling/autoscale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threshold: cpuThreshold,
            cpu: liveTelemetry?.cpu,
          }),
        });
        const data = await res.json();
        const time = new Date().toLocaleTimeString();

        if (data.triggered) {
          setAutoScaleLog((prev) => [
            { time, message: data.message, type: "success" },
            ...prev.slice(0, 9),
          ]);
          addScalingEvent({
            id: `evt-auto-${Date.now()}`,
            type: "scale_up",
            resourceId: `AWS EC2 (${data.instanceId || "us-east-1"})`,
            policyId: "AWS EC2 Target CPU 70% Policy",
            cloudProvider: "aws",
            region: "us-east-1",
            status: "success",
            reason: `Autonomous Auto-Scaler: CPU reached ${data.cpu}% (threshold: ${cpuThreshold}%)`,
            timestamp: time,
          });
        } else if (data.inCooldown) {
          setAutoScaleLog((prev) => [
            { time, message: data.message, type: "warning" },
            ...prev.slice(0, 9),
          ]);
        } else {
          setAutoScaleLog((prev) => [
            { time, message: `✓ CPU: ${data.cpu}% — Below threshold (${cpuThreshold}%). Auto-Scaler on standby.`, type: "info" },
            ...prev.slice(0, 9),
          ]);
        }
      } catch (err: any) {
        setAutoScaleLog((prev) => [
          { time: new Date().toLocaleTimeString(), message: `Engine check error: ${err.message}`, type: "warning" },
          ...prev.slice(0, 9),
        ]);
      } finally {
        setAutoScaleChecking(false);
      }
    };

    const interval = setInterval(runAutoScaleCheck, 15000);
    runAutoScaleCheck(); // run immediately on mount
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpuThreshold]);

  const awsResources = resources.filter((r) => r.cloudProvider === "aws");
  const liveCpu = liveTelemetry?.cpu ?? 12;
  const liveMemory = liveTelemetry?.memory ?? 52;
  const liveLatency = liveTelemetry?.latency ?? 24;
  const unreadAlerts = notifications.filter((n) => !n.read).length;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Operations Center</h1>
          <p>Real-time telemetry, autonomous auto-scaling engine, and infrastructure health for Amazon Web Services.</p>
        </div>
        <div className="actions">
          <ActionButton action="manual-scale" className="ghost-button">
            <Gauge size={16} /> Manual Scale
          </ActionButton>
          <ActionButton action="create-policy" className="ghost-button">
            <Plus size={16} /> Create Policy
          </ActionButton>
          <ActionButton action="export-report">
            <Download size={16} /> Export Operations Report
          </ActionButton>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="image-band dashboard-band">
        <div>
          <h2>AWS Autonomous Cloud Operations Surface</h2>
          <p>Live CloudWatch metric streams, autonomous scaling policies, and compliance telemetry in one unified platform.</p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="AWS Resources" value={String(awsResources.length)} trend="Live Discovered" icon={<Database size={18} />} />
        <MetricCard label="Live AWS CPU" value={`${liveCpu}%`} trend={liveCpu > cpuThreshold ? "⚡ Scaling Threshold Breached!" : "Operating in Safe Range"} icon={<Cpu size={18} />} />
        <MetricCard label="Memory Footprint" value={`${liveMemory}%`} trend="Within Policy Envelope" icon={<Activity size={18} />} />
        <MetricCard label="Open Alerts" value={String(unreadAlerts)} trend={unreadAlerts > 0 ? "Requires Attention" : "All Systems Normal"} icon={<Bell size={18} />} />
      </section>

      <section className="grid two">
        {/* Realtime Metrics Chart */}
        <div className="panel">
          <div className="section-head">
            <div>
              <h2>Live AWS Metric Stream</h2>
              <p>{liveTelemetry?.source || "Connecting to AWS CloudWatch..."}</p>
            </div>
            <StatusBadge value="active" />
          </div>
          <LiveChart data={metricHistory} keys={["cpu", "memory", "network", "latency"]} kind="area" />
        </div>

        {/* ⚡ REAL Autonomous Auto-Scale Engine Panel */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="section-head">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap style={{ color: "#ff9900" }} size={20} />
              <h2>Autonomous Auto-Scale Engine</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoScaleEnabled(!autoScaleEnabled);
                setAutoScaleLog((prev) => [{
                  time: new Date().toLocaleTimeString(),
                  message: !autoScaleEnabled ? "⚡ Auto-Scaler ENABLED — Monitoring AWS CloudWatch every 15s" : "⏸ Auto-Scaler PAUSED — Monitoring suspended",
                  type: !autoScaleEnabled ? "success" : "warning",
                }, ...prev.slice(0, 9)]);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "5px 12px", borderRadius: "6px",
                background: autoScaleEnabled ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: autoScaleEnabled ? "#4ade80" : "#f87171",
                border: `1px solid ${autoScaleEnabled ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              {autoScaleEnabled ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {autoScaleEnabled ? "Engine Active" : "Engine Paused"}
            </button>
          </div>

          {/* CPU Threshold Slider */}
          <div style={{ background: "#080c14", borderRadius: "8px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--faint)" }}>CPU Threshold to Trigger Scale-Up</span>
              <strong style={{ fontSize: "14px", color: "#ff9900" }}>{cpuThreshold}%</strong>
            </div>
            <input
              type="range" min={30} max={95} step={5}
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ff9900" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>
              <span>30% (Aggressive)</span><span>95% (Conservative)</span>
            </div>
          </div>

          {/* Status Info Row */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, background: "#080c14", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "11px", color: "var(--faint)" }}>Live CPU</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: liveCpu > cpuThreshold ? "#f87171" : "#4ade80" }}>{liveCpu}%</div>
            </div>
            <div style={{ flex: 1, background: "#080c14", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "11px", color: "var(--faint)" }}>Threshold</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#ff9900" }}>{cpuThreshold}%</div>
            </div>
            <div style={{ flex: 1, background: "#080c14", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "11px", color: "var(--faint)" }}>Next Check</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>
                {autoScaleChecking ? <RotateCw size={16} style={{ display: "inline" }} className="spin" /> : "15s interval"}
              </div>
            </div>
          </div>

          {/* Engine Activity Log */}
          <div style={{ flex: 1, background: "#04060d", borderRadius: "8px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", maxHeight: "180px", overflowY: "auto" }}>
            <div style={{ fontSize: "11px", color: "var(--faint)", marginBottom: "8px", fontWeight: 600 }}>
              Engine Activity Log (last 10 events)
            </div>
            {autoScaleLog.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--faint)", fontStyle: "italic" }}>Initializing engine…</div>
            ) : (
              autoScaleLog.map((entry, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "12px" }}>
                  <span style={{ color: "var(--faint)", flexShrink: 0 }}>{entry.time}</span>
                  <span style={{ color: entry.type === "success" ? "#4ade80" : entry.type === "warning" ? "#fcd34d" : "var(--faint)" }}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Scaling Decisions Table */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <h2>Recent AWS Scaling Decisions</h2>
          <p>Decisions executed automatically by the Auto-Scale Engine or manual operator overrides.</p>
        </div>
        <DataTable
          rows={scalingEvents}
          columns={[
            { key: "type", header: "Decision" },
            { key: "resourceId", header: "Target Resource" },
            { key: "policyId", header: "Applied Policy" },
            { key: "region", header: "Region" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r.status)} /> },
            { key: "reason", header: "Trigger Reason" },
            { key: "timestamp", header: "Time" },
          ]}
        />
      </section>
    </div>
  );
}
