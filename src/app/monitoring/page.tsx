"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { StatusBadge } from "@/components/StatusBadge";
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
  const [selectedResource, setSelectedResource] = useState("aws-ec2-t2-micro");
  
  const gcpVmResource = {
    id: "gcp-free-vm",
    name: "GCP e2-micro (Always Free)",
    type: "vm",
    cloudProvider: "gcp",
    region: process.env.NEXT_PUBLIC_GCP_ZONE || "us-central1-a",
  };

  const alibabaResource = {
    id: "alicloud-ecs-gateway",
    name: "Alibaba Cloud ECS (ap-southeast-1)",
    type: "container",
    cloudProvider: "alibaba",
    region: "ap-southeast-1",
  };

  const awsResource = {
    id: "aws-ec2-t2-micro",
    name: "AWS EC2 t2.micro (Free Tier)",
    type: "vm",
    cloudProvider: "aws",
    region: "us-east-1",
  };

  const allMonitorableResources = [
    awsResource,
    gcpVmResource,
    alibabaResource,
    ...resources,
  ];

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/monitoring?resourceId=${selectedResource}`);
      if (res.ok) {
        const data: MonitoringSnapshot = await res.json();
        setLastSnapshot(data);
        setIsLive(Boolean(data.source && (data.source.includes("Live") || data.source.includes("AWS") || data.source.includes("GCP"))));
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
    setPoints([]); // reset chart on resource change
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
          <h1>Realtime Monitoring</h1>
          <p>
            {lastSnapshot?.source
              ? `Source: ${lastSnapshot.source}${lastSnapshot.instanceId ? ` (${lastSnapshot.instanceId})` : ""}`
              : "Connecting to cloud telemetry..."}
          </p>
        </div>
        <div className="segmented" style={{ alignItems: "center", gap: "8px" }}>
          {/* Live/Simulated badge */}
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
            {lastSnapshot?.source?.includes("AWS") ? "Live AWS" : lastSnapshot?.source?.includes("GCP") ? "Live GCP" : isLive ? "Live Cloud" : "Simulated"}
          </span>

          {/* Resource selector */}
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

          {["1h", "6h", "24h", "7d"].map((range) => (
            <button
              className={activeRange === range ? "ghost-button selected" : "ghost-button"}
              type="button"
              key={range}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          ))}
          <ActionButton action="refresh-monitoring">
            <RefreshCw size={16} /> Refresh
          </ActionButton>
        </div>
      </header>

      {/* GCP VM KPI strip */}
      <section className="grid kpis" style={{ marginBottom: "20px" }}>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: cpuVal > 80 ? "var(--critical)" : cpuVal > 60 ? "var(--warning)" : "var(--success)" }}>
            {cpuVal}%
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>CPU Utilisation</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: memVal > 85 ? "var(--critical)" : memVal > 70 ? "var(--warning)" : "var(--success)" }}>
            {memVal}%
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Memory Used</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>
            {netVal} <span style={{ fontSize: "1rem" }}>Kbps</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Network Out</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: latVal > 100 ? "var(--warning)" : "var(--success)" }}>
            {latVal} <span style={{ fontSize: "1rem" }}>ms</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>Latency</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Live Metric Stream</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <StatusBadge value="active" />
            {lastSnapshot?.instanceId && (
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                Instance: {lastSnapshot.instanceId}
              </span>
            )}
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>
              {lastSnapshot?.source ?? ""}
            </span>
          </div>
        </div>
        <LiveChart data={points} keys={["cpu", "memory", "network", "latency"]} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Resource Health Grid</h2>
          <p>Current usage from discovered resources.</p>
        </div>
        <DataTable
          rows={resources}
          columns={[
            { key: "name", header: "Resource" },
            { key: "type", header: "Type" },
            { key: "cloudProvider", header: "Provider" },
            { key: "region", header: "Region" },
            { key: "cpuUsage", header: "CPU", render: (row) => `${row.cpuUsage}%` },
            { key: "memoryUsage", header: "Memory", render: (row) => `${row.memoryUsage}%` },
            { key: "status", header: "Health", render: (row) => <StatusBadge value={String(row.status)} /> },
          ]}
        />
      </section>
    </div>
  );
}
