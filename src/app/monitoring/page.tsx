"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, Server, Terminal as TerminalIcon } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { StatusBadge } from "@/components/StatusBadge";
import { WebTerminal } from "@/components/WebTerminal";
import { useData } from "@/context/DataContext";
import type { MetricPoint } from "@/lib/realtimeDb";

interface MonitoringSnapshot extends MetricPoint {
  resourceId?: string;
  source?: string;
  instanceId?: string;
}

export default function MonitoringPage() {
  const { resources } = useData();
  const [points, setPoints] = useState<MonitoringSnapshot[]>([]);
  const [activeRange, setActiveRange] = useState("1h");
  const [lastSnapshot, setLastSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [selectedResource, setSelectedResource] = useState("aws-ec2-t3-micro");
  const [showTerminal, setShowTerminal] = useState(true);

  const awsResource = {
    id: "aws-ec2-t3-micro",
    name: "AWS EC2 t3.micro (us-east-1 Live)",
    type: "vm",
    cloudProvider: "aws",
    region: "us-east-1",
  };

  const allMonitorableResources = [awsResource, ...resources.filter(r => r.cloudProvider === "aws")];

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/monitoring?resourceId=${selectedResource}`);
      if (res.ok) {
        const data: MonitoringSnapshot = await res.json();
        setLastSnapshot(data);
        setIsLive(Boolean(data.source && (data.source.includes("Live") || data.source.includes("AWS"))));
        setPoints((prev) => {
          const next = [...prev, data];
          if (next.length > 20) next.shift();
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to fetch metrics", e);
    }
  };

  useEffect(() => {
    setPoints([]);
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource]);

  const cpuVal = lastSnapshot?.cpu ?? 0;
  const memVal = lastSnapshot?.memory ?? 0;
  const netVal = lastSnapshot?.network ?? 0;
  const latVal = lastSnapshot?.latency ?? 0;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Realtime AWS Cloud Monitoring</h1>
          <p>
            {lastSnapshot?.source
              ? `Source: ${lastSnapshot.source}${lastSnapshot.instanceId ? ` (ID: ${lastSnapshot.instanceId})` : ""}`
              : "Connecting to AWS CloudWatch..."}
          </p>
        </div>
        <div className="segmented" style={{ alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              background: isLive ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.10)",
              color: isLive ? "var(--success)" : "var(--warning)",
              border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
          >
            {isLive ? <Wifi size={13} /> : <WifiOff size={13} />}
            {lastSnapshot?.source?.includes("AWS") ? "Live AWS" : "Simulated"}
          </span>

          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "#0d1424",
              color: "var(--foreground)",
              fontSize: "13px",
            }}
          >
            {allMonitorableResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowTerminal(!showTerminal)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <TerminalIcon size={14} /> {showTerminal ? "Hide Console" : "Web SSH"}
          </button>

          <ActionButton action="refresh-monitoring">
            <RefreshCw size={16} /> Refresh
          </ActionButton>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid kpis" style={{ marginBottom: "20px" }}>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: cpuVal > 80 ? "var(--critical)" : cpuVal > 60 ? "var(--warning)" : "var(--success)" }}>
            {cpuVal}%
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>CPU Utilization (AWS)</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: memVal > 85 ? "var(--critical)" : memVal > 70 ? "var(--warning)" : "var(--success)" }}>
            {memVal}%
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Memory Footprint</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>
            {netVal} <span style={{ fontSize: "1rem" }}>Kbps</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Cloud Throughput</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: latVal > 100 ? "var(--warning)" : "var(--success)" }}>
            {latVal} <span style={{ fontSize: "1rem" }}>ms</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Network Latency</div>
        </div>
      </section>

      {/* Embedded Web Terminal Section */}
      {showTerminal && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <div className="section-head">
            <h2>AWS Web SSH Console & Load Generator</h2>
            <p>Run diagnostic commands or dispatch traffic surge commands directly to your cloud instance.</p>
          </div>
          <WebTerminal defaultCommand="status" />
        </section>
      )}

      {/* Live Chart Stream */}
      <section className="panel">
        <div className="section-head">
          <h2>Live Cloud Metric Stream</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <StatusBadge value="active" />
            {lastSnapshot?.instanceId && (
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                Target Instance: {lastSnapshot.instanceId}
              </span>
            )}
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>
              {lastSnapshot?.source ?? ""}
            </span>
          </div>
        </div>
        <LiveChart data={points} keys={["cpu", "memory", "network", "latency"]} />
      </section>
    </div>
  );
}
