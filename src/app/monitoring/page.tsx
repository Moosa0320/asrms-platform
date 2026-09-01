"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, ExternalLink, Copy, Check, Server, Zap } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
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
  const [lastSnapshot, setLastSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // AWS-Only Monitorable Resources
  const awsResources = [
    {
      id: "aws-ec2-t3-micro",
      name: "AWS EC2 t3.micro Instance (us-east-1 Live)",
      type: "vm",
      cloudProvider: "aws",
      region: "us-east-1",
    },
    ...resources.filter((r) => r.cloudProvider === "aws" && r.id !== "aws-ec2-t3-micro"),
  ];

  const [selectedResource, setSelectedResource] = useState(awsResources[0].id);

  const stressCommands = [
    {
      title: "🐍 Python 3 Live Stress Test (60s Auto-Timer with Progress)",
      command: `python3 -c "import time; print('🔥 400MB RAM & 100% CPU Stress Started...'); d='X'*(400*1024*1024); t=time.time()+60\nwhile time.time()<t:\n  sum(i*i for i in range(1000000))\n  print(f'⚡ Stressing: {int(t-time.time())}s remaining', end='\\r', flush=True)\nprint('\\n✓ Completed!')"`,
      description: "Allocates 400MB RAM and drives CPU to 100% with a live second-by-second countdown. Auto-stops after 60s.",
    },
    {
      title: "⚡ Standard Linux Stress Utility (5-Minute Run)",
      command: `sudo apt update && sudo apt install -y stress && stress --cpu 2 --vm 1 --vm-bytes 300M --timeout 300s`,
      description: "Official Linux stress utility. Runs 100% CPU & 300MB RAM load for 5 minutes and exits automatically.",
    },
    {
      title: "🔥 Quick Background 1-Core CPU Loop",
      command: `timeout 300 bash -c 'while true; do :; done' &`,
      description: "Runs 50% CPU in the background for 5 minutes. Stop anytime with 'killall bash'.",
    },
  ];

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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
              ? `Source: ${lastSnapshot.source}${lastSnapshot.instanceId ? ` (Target: ${lastSnapshot.instanceId})` : ""}`
              : "Connecting to AWS CloudWatch..."}
          </p>
        </div>
        <div className="segmented" style={{ alignItems: "center", gap: "10px" }}>
          {/* Live Status Badge */}
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
            {lastSnapshot?.source?.includes("AWS") ? "Live AWS" : "Connecting"}
          </span>

          {/* AWS-Only Dropdown */}
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
            {awsResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Direct AWS EC2 Connect Link */}
          <a
            href="https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #ff9900, #e68a00)",
              color: "#000",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={14} /> Open AWS Console
          </a>

          <ActionButton action="refresh-monitoring">
            <RefreshCw size={16} /> Refresh
          </ActionButton>
        </div>
      </header>

      {/* KPI Metric Cards */}
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
          <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>AWS Latency</div>
        </div>
      </section>

      {/* Live Chart Stream */}
      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="section-head">
          <h2>AWS Live Metric Stream</h2>
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

      {/* Direct AWS Stress & Load Commands Helper Panel */}
      <section className="panel">
        <div className="section-head">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap style={{ color: "#ff9900" }} size={20} />
            <h2>Direct AWS Load & Stress Commands</h2>
          </div>
          <p>Copy any command below, click "Open AWS Console" above, connect via EC2 Instance Connect, and paste to test real-world CPU/Memory scaling!</p>
        </div>

        <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
          {stressCommands.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "#080c14",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, color: "#f3f4f6", fontSize: "13px" }}>{item.title}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.command, idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: copiedIndex === idx ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.08)",
                    color: copiedIndex === idx ? "#4ade80" : "#9ca3af",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                  {copiedIndex === idx ? "Copied!" : "Copy Command"}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "var(--faint)", margin: "0 0 8px 0" }}>{item.description}</p>
              <code
                style={{
                  display: "block",
                  background: "#05080f",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  color: "#38bdf8",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  wordBreak: "break-all",
                }}
              >
                {item.command}
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
