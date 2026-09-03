"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, ExternalLink, Copy, Check, Power, TerminalSquare } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { LiveChart } from "@/components/LiveChart";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import type { MetricPoint } from "@/lib/realtimeDb";

interface MonitoringSnapshot extends MetricPoint {
  resourceId?: string;
  source?: string;
  instanceId?: string;
  state?: string;
}

export default function MonitoringPage() {
  const { resources } = useData();
  const [points, setPoints] = useState<MonitoringSnapshot[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const awsResources = [
    {
      id: "aws-ec2-t3-micro",
      name: "AWS EC2 t3.micro (us-east-1)",
      type: "vm",
      cloudProvider: "aws",
      region: "us-east-1",
    },
    ...resources.filter((r) => r.cloudProvider === "aws" && r.id !== "aws-ec2-t3-micro"),
  ];

  const [selectedResource, setSelectedResource] = useState(awsResources[0].id);

  const stressCommands = [
    {
      id: "cpu-60s",
      title: "CPU Load (All Cores, 60 Seconds)",
      command: "for i in $(seq 1 $(nproc)); do yes > /dev/null & done; sleep 60; killall yes",
      description: "Spawns parallel yes processes on all CPU cores and auto-terminates after 60s.",
    },
    {
      id: "cpu-mem-60s",
      title: "CPU + Memory Stress (Python3, 60 Seconds)",
      command: `python3 -c "import time; data = bytearray(300 * 1024 * 1024); t = time.time() + 60; [i*i for i in range(100000000) if time.time() < t]"`,
      description: "Allocates 300MB RAM and runs continuous floating-point calculations for 60s.",
    },
    {
      id: "stress-pkg",
      title: "Linux Stress Utility (60 Seconds)",
      command: "sudo apt update && sudo apt install -y stress 2>/dev/null || sudo yum install -y stress 2>/dev/null; stress --cpu 2 --vm 1 --vm-bytes 256M --timeout 60s",
      description: "Executes standard stress utility for 2 CPU workers and 256MB memory.",
    },
    {
      id: "bg-loop",
      title: "Background Infinite CPU Loop",
      command: "while true; do :; done &",
      description: "Runs infinite while loop in background. Stop with: pkill -f 'while true'",
    },
    {
      id: "stop-all",
      title: "Terminate All Stress Processes",
      command: "killall yes 2>/dev/null; pkill -f 'while true' 2>/dev/null; pkill -f python3 2>/dev/null; killall stress 2>/dev/null",
      description: "Kills all background yes, python, while loops, and stress utility processes.",
    },
  ];

  const powerCommands = [
    {
      id: "start-aws-cli",
      title: "Start EC2 Instance (AWS CLI)",
      command: "aws ec2 start-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
      description: "Powers on the stopped EC2 instance via AWS CLI.",
    },
    {
      id: "stop-aws-cli",
      title: "Stop EC2 Instance (AWS CLI)",
      command: "aws ec2 stop-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
      description: "Gracefully powers off the EC2 instance via AWS CLI.",
    },
    {
      id: "reboot-aws-cli",
      title: "Reboot EC2 Instance (AWS CLI)",
      command: "aws ec2 reboot-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
      description: "Performs a clean reboot of the EC2 instance via AWS CLI.",
    },
    {
      id: "status-aws-cli",
      title: "Check Instance State (AWS CLI)",
      command: 'aws ec2 describe-instances --instance-ids i-02720bd65ad532385 --region us-east-1 --query "Reservations[*].Instances[*].State.Name" --output text',
      description: "Queries current status (running, stopped, pending) of the instance.",
    },
    {
      id: "install-aws-cli",
      title: "Install AWS CLI on Ubuntu EC2",
      command: "sudo apt update && sudo apt install -y awscli",
      description: "Run this once inside the SSH terminal if you want to use the aws command.",
    },
    {
      id: "shutdown-ssh",
      title: "Shutdown from Inside SSH Session (No AWS CLI Needed)",
      command: "sudo poweroff",
      description: "Standard Linux command to power off the VM immediately from within SSH.",
    },
    {
      id: "reboot-ssh",
      title: "Reboot from Inside SSH Session (No AWS CLI Needed)",
      command: "sudo reboot",
      description: "Standard Linux command to reboot the VM directly from within SSH.",
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
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
              ? `Source: ${lastSnapshot.source}`
              : "Connecting to AWS CloudWatch..."}
          </p>
        </div>
        <div className="segmented" style={{ alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "5px",
              fontSize: "12px",
              fontFamily: "var(--font-data)",
              background: isLive ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
              color: isLive ? "var(--success)" : "var(--warning)",
              border: `1px solid ${isLive ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)"}`,
            }}
          >
            {isLive ? <Wifi size={13} /> : <WifiOff size={13} />}
            {lastSnapshot?.source?.includes("AWS") ? "Live AWS" : "Connecting"}
          </span>

          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "5px",
              border: "1px solid var(--line)",
              background: "#0E1118",
              color: "var(--text)",
              fontSize: "12px",
              fontFamily: "var(--font-data)",
            }}
          >
            {awsResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <a
            href="https://us-east-1.console.aws.amazon.com/ec2/home#Instances"
            target="_blank"
            rel="noreferrer"
            className="button"
            style={{ fontSize: "12px" }}
          >
            <ExternalLink size={13} /> Open AWS Console
          </a>

          <ActionButton action="refresh-monitoring">
            <RefreshCw size={14} /> Refresh
          </ActionButton>
        </div>
      </header>

      {/* KPI Metric Cards */}
      <section className="grid kpis">
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "24px", fontWeight: 600, color: cpuVal > 80 ? "var(--critical)" : cpuVal > 60 ? "var(--warning)" : "var(--success)" }}>
            {cpuVal}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>CPU Utilization</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "24px", fontWeight: 600, color: memVal > 85 ? "var(--critical)" : memVal > 70 ? "var(--warning)" : "var(--success)" }}>
            {memVal}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>Memory Footprint</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "24px", fontWeight: 600, color: "var(--primary)" }}>
            {netVal} <span style={{ fontSize: "12px" }}>Kbps</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>Throughput</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "24px", fontWeight: 600, color: latVal > 100 ? "var(--warning)" : "var(--success)" }}>
            {latVal} <span style={{ fontSize: "12px" }}>ms</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>AWS Latency</div>
        </div>
      </section>

      {/* Live Chart Stream */}
      <section className="panel">
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div>
            <h2>AWS Live Metric Stream</h2>
            <p style={{ marginTop: "2px", fontSize: "11px" }}>
              {lastSnapshot?.source ?? ""}
            </p>
          </div>
          <StatusBadge value={lastSnapshot?.state === "stopped" ? "inactive" : "active"} />
        </div>
        <LiveChart data={points} keys={["cpu", "memory", "network", "latency"]} height={280} />
      </section>

      {/* AWS Stress & Load Commands */}
      <section className="stress-panel">
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <TerminalSquare size={15} style={{ color: "var(--primary)" }} />
            <h2>AWS EC2 Load & Stress Commands</h2>
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
          Copy any command below, paste into your EC2 SSH session, and monitor live metrics.
        </p>

        {stressCommands.map((item) => (
          <div key={item.id} className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                {item.title}
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>{item.description}</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(item.command, item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "4px",
                background: copiedIndex === item.id ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copiedIndex === item.id ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
                color: copiedIndex === item.id ? "var(--success)" : "var(--muted)",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "var(--font-data)",
                transition: "all 0.15s",
              }}
            >
              {copiedIndex === item.id ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === item.id ? "Copied" : "Copy"}
            </button>
            <a
              href="https://us-east-1.console.aws.amazon.com/ec2/home#Instances"
              target="_blank"
              rel="noopener noreferrer"
              title="Open EC2 Console"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                color: "var(--faint)",
                background: "rgba(255,255,255,0.03)",
                flexShrink: 0,
              }}
            >
              <ExternalLink size={11} />
            </a>
          </div>
        ))}
      </section>

      {/* Manual Instance Power Commands */}
      <section className="stress-panel" style={{ borderTop: "2px solid var(--primary)" }}>
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Power size={15} style={{ color: "var(--primary)" }} />
            <h2>Manual Start & Stop Commands (AWS CLI & SSH)</h2>
          </div>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-data)", color: "var(--faint)" }}>
            Instance: i-02720bd65ad532385
          </span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: "11px", color: "var(--faint)" }}>
          Run these commands in your local terminal (with AWS CLI configured) or inside SSH to manually control the EC2 instance power state.
        </p>

        {powerCommands.map((item) => (
          <div key={item.id} className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                {item.title}
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>{item.description}</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(item.command, item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "4px",
                background: copiedIndex === item.id ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copiedIndex === item.id ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
                color: copiedIndex === item.id ? "var(--success)" : "var(--muted)",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "var(--font-data)",
                transition: "all 0.15s",
              }}
            >
              {copiedIndex === item.id ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === item.id ? "Copied" : "Copy"}
            </button>
            <a
              href="https://us-east-1.console.aws.amazon.com/ec2/home#Instances"
              target="_blank"
              rel="noopener noreferrer"
              title="Open EC2 Console"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                color: "var(--faint)",
                background: "rgba(255,255,255,0.03)",
                flexShrink: 0,
              }}
            >
              <ExternalLink size={11} />
            </a>
          </div>
        ))}
      </section>
    </div>
  );
}
