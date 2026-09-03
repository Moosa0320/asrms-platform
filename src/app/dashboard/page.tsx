"use client";

import { useEffect, useState } from "react";
import {
  Activity, Bell, Clipboard, ClipboardCheck, Cpu, Database,
  Download, ExternalLink, Gauge, Plus, Power, TerminalSquare,
} from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";

// ─── Verified Linux / Bash Stress Commands (No Emojis) ───────────────────────
const STRESS_CMDS = [
  {
    id: "cpu-60s",
    label: "CPU Load (All Cores, 60 Seconds)",
    description: "Runs parallel workload across all CPU cores and auto-terminates after 60s.",
    cmd: "for i in $(seq 1 $(nproc)); do yes > /dev/null & done; sleep 60; pkill -9 yes 2>/dev/null || killall yes 2>/dev/null",
  },
  {
    id: "cpu-mem-python",
    label: "CPU + Memory Stress (Python3, 60 Seconds)",
    description: "Allocates memory and runs floating-point iterations for 60s.",
    cmd: `python3 -c "import time; t=time.time()+60; [i*i for i in range(100000000) if time.time()<t]"`,
  },
  {
    id: "stress-pkg",
    label: "Linux Stress Utility (60 Seconds)",
    description: "Installs stress tool and applies CPU and memory load for 60s.",
    cmd: "sudo apt update && sudo apt install -y stress && stress --cpu 2 --vm 1 --vm-bytes 256M --timeout 60s",
  },
  {
    id: "bg-loop",
    label: "Background Infinite CPU Loop",
    description: "Runs infinite while loop in background. Stop with: pkill -9 -f 'while true'",
    cmd: "while true; do :; done &",
  },
  {
    id: "stop-all",
    label: "Terminate All Active Stress Processes",
    description: "Immediately kills all background yes, python, while loops, and stress utility processes.",
    cmd: "pkill -9 yes 2>/dev/null; pkill -9 -f 'while true' 2>/dev/null; pkill -9 python3 2>/dev/null; pkill -9 stress 2>/dev/null; killall yes 2>/dev/null",
  },
];

// ─── Manual Instance Start/Stop Commands ─────────────────────────────────────
const POWER_CMDS = [
  {
    id: "shutdown-ssh",
    label: "Stop EC2 Instance (Inside SSH - No AWS CLI Needed)",
    description: "Standard Linux command to power off the VM immediately from inside SSH. AWS detects it as stopped.",
    cmd: "sudo poweroff",
  },
  {
    id: "reboot-ssh",
    label: "Reboot EC2 Instance (Inside SSH - No AWS CLI Needed)",
    description: "Standard Linux command to reboot the VM directly from inside your SSH session.",
    cmd: "sudo reboot",
  },
  {
    id: "install-aws-cli",
    label: "Install AWS CLI on Ubuntu EC2 (Optional)",
    description: "Run this inside SSH if you want to use the aws command line tool inside the server.",
    cmd: "sudo apt update && sudo apt install -y awscli && aws configure",
  },
  {
    id: "stop-aws-cli",
    label: "Stop EC2 Instance (From Local PC via AWS CLI)",
    description: "Run on your computer with AWS CLI configured to power off the instance remotely.",
    cmd: "aws ec2 stop-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
  },
  {
    id: "start-aws-cli",
    label: "Start EC2 Instance (From Local PC via AWS CLI)",
    description: "Run on your computer with AWS CLI configured to power on the stopped EC2 instance.",
    cmd: "aws ec2 start-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
  },
  {
    id: "reboot-aws-cli",
    label: "Reboot EC2 Instance (From Local PC via AWS CLI)",
    description: "Run on your computer with AWS CLI configured to cleanly reboot the instance.",
    cmd: "aws ec2 reboot-instances --instance-ids i-02720bd65ad532385 --region us-east-1",
  },
  {
    id: "status-aws-cli",
    label: "Check State (From Local PC via AWS CLI)",
    description: "Queries current status (running, stopped, pending) of the instance.",
    cmd: 'aws ec2 describe-instances --instance-ids i-02720bd65ad532385 --region us-east-1 --query "Reservations[*].Instances[*].State.Name" --output text',
  },
];

// ─── Copy Button ─────────────────────────────────────────────────────────────
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

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { resources, scalingEvents } = useData();
  const { notifications } = useAppActions();
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const canOperate = role === "admin" || role === "super_admin" || role === "operator";

  const [liveTelemetry, setLiveTelemetry] = useState<{
    cpu: number; memory: number; network: number; latency: number; source?: string; instanceId?: string; state?: string;
  } | null>(null);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  // Live telemetry polling — every 3 seconds
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/monitoring?resourceId=aws-ec2-t3-micro");
        if (res.ok) {
          const data = await res.json();
          setLiveTelemetry(data);
          setMetricHistory((prev) => {
            const next = [...prev, { ...data, time: new Date().toLocaleTimeString() }];
            if (next.length > 20) next.shift();
            return next;
          });
        }
      } catch { /* silent */ }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  const awsResources = resources.filter((r) => r.cloudProvider === "aws");
  const liveCpu = liveTelemetry?.cpu ?? 0;
  const liveMemory = liveTelemetry?.memory ?? 0;
  const isCpuBreaching = liveCpu >= 70;
  const unreadAlerts = notifications.filter((n) => !n.read).length;

  return (
    <div className="page">
      {/* Page Heading */}
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Operations Center</h1>
          <p>Real-time CloudWatch telemetry, infrastructure scaling decisions, and resource monitoring.</p>
        </div>
        <div className="actions">
          <span className="live-dot">AWS connected</span>
          {canOperate && (
            <>
              <ActionButton action="manual-scale" className="ghost-button">
                <Gauge size={14} /> Manual Scale
              </ActionButton>
              <ActionButton action="create-policy" className="ghost-button">
                <Plus size={14} /> Policy
              </ActionButton>
            </>
          )}
          <ActionButton action="export-report">
            <Download size={14} /> Export
          </ActionButton>
        </div>
      </header>

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
          trend={isCpuBreaching ? "Threshold breached (70%)" : "Target threshold: 70%"}
          icon={<Cpu size={15} />}
          breaching={isCpuBreaching}
        />
        <MetricCard
          label="Memory Footprint"
          value={`${liveMemory}%`}
          trend="Policy threshold: 85%"
          icon={<Activity size={15} />}
        />
        <MetricCard
          label="Open Alerts"
          value={String(unreadAlerts)}
          trend={unreadAlerts > 0 ? "Requires review" : "All systems normal"}
          icon={<Bell size={15} />}
        />
      </section>

      {/* Live Metric Stream Chart */}
      <section className="panel">
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div>
            <h2>Live AWS Metric Stream</h2>
            <p style={{ marginTop: "2px", fontSize: "11px" }}>
              {liveTelemetry?.source ?? "Connecting to AWS CloudWatch..."}
            </p>
          </div>
          <StatusBadge value={liveTelemetry?.state === "stopped" ? "inactive" : "active"} />
        </div>
        <LiveChart data={metricHistory} keys={["cpu", "memory", "network", "latency"]} kind="area" height={260} />
      </section>

      {/* Load Test & Stress Commands */}
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
          Copy any command below, paste into your EC2 terminal session, and monitor live telemetry above.
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
              title="Open EC2 Console"
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

      {/* Manual Start / Stop / Reboot Power Commands */}
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
        {POWER_CMDS.map((cmd) => (
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
              title="Open EC2 Console"
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

      {/* Recent Scaling Decisions Table */}
      <section className="panel" style={{ marginTop: "2px" }}>
        <div className="section-head" style={{ marginBottom: "10px" }}>
          <div>
            <h2>Recent Scaling Decisions</h2>
            <p style={{ marginTop: "2px", fontSize: "11px" }}>Executed by auto-scaling policies or operator overrides.</p>
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
