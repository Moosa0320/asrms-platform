"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Zap,
  Power,
  Server,
  RotateCw,
  Lock,
  TrendingUp,
  TrendingDown,
  Activity,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy command"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        fontFamily: "var(--font-data)",
        background: copied ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
        color: copied ? "var(--success)" : "var(--muted)",
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ScalingPage() {
  const { resources, scalingEvents, addScalingEvent, adjustResourceCpu } = useData();
  const { user } = useAuth();
  const role = user?.role || "viewer";

  const targetResource = resources[0] || {
    id: "res-aws-1",
    name: "AWS EC2 t3.micro",
    cpuUsage: 45,
    memoryUsage: 42,
    status: "healthy",
  };

  const currentCpu = targetResource.cpuUsage;

  const [selectedAction, setSelectedAction] = useState("start");
  const [reason, setReason] = useState("Manual operator override for AWS EC2 instance scaling.");
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message?: string; error?: string } | null>(null);

  // ─── Autonomous Auto-Scaling Daemon State ─────────────────────────────────────
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownCountdown, setCooldownCountdown] = useState(5);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auto-Scaling Trigger: Decreases CPU every 5s when CPU >= 90% ────────────
  useEffect(() => {
    if (!autoScalingEnabled) {
      setIsCoolingDown(false);
      return;
    }

    // When CPU crosses 90%, start 5-second step-down cycle
    if (currentCpu >= 90 && !isCoolingDown) {
      setIsCoolingDown(true);
      setCooldownCountdown(5);

      // Add trigger alert to scaling decisions log
      addScalingEvent({
        id: `evt-spike-${Date.now()}`,
        resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
        policyId: "AWS-EC2-Target-CPU-70%",
        type: "scale_down",
        cloudProvider: "aws",
        region: "us-east-1",
        status: "success",
        reason: `Auto-Scaler: CPU breached critical threshold (${currentCpu}% >= 90%). Commencing 5-second autonomous cooldown steps.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, [currentCpu, autoScalingEnabled, isCoolingDown, targetResource.name, addScalingEvent]);

  // Handle the active 5-second cooldown ticks
  useEffect(() => {
    if (!isCoolingDown || !autoScalingEnabled) {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    // 1-second interval to update countdown UI from 5 to 1
    countdownIntervalRef.current = setInterval(() => {
      setCooldownCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    // 5-second interval: step down CPU by 18% each time
    cooldownTimerRef.current = setInterval(() => {
      const activeRes = resources[0];
      const activeCpu = activeRes ? activeRes.cpuUsage : 90;

      if (activeCpu > 45) {
        const stepDownAmount = 18;
        const newCpu = Math.max(35, activeCpu - stepDownAmount);
        adjustResourceCpu(targetResource.id, -stepDownAmount, true);

        addScalingEvent({
          id: `evt-step-${Date.now()}`,
          resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
          policyId: "AWS-EC2-Target-CPU-70%",
          type: "scale_down",
          cloudProvider: "aws",
          region: "us-east-1",
          status: "success",
          reason: `Auto-Scaler (5s interval): Stepped down CPU load to ${newCpu}%. System cooling down.`,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (newCpu <= 45) {
          setIsCoolingDown(false);
          addScalingEvent({
            id: `evt-stabilized-${Date.now()}`,
            resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
            policyId: "AWS-EC2-Target-CPU-70%",
            type: "scale_down",
            cloudProvider: "aws",
            region: "us-east-1",
            status: "success",
            reason: `Auto-Scaler: CPU stabilized below threshold at ${newCpu}%. Capacity normalized.`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else {
        setIsCoolingDown(false);
      }
    }, 5000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isCoolingDown, autoScalingEnabled, resources, targetResource.id, targetResource.name, adjustResourceCpu, addScalingEvent]);

  // ─── Manual Scaling Action Submit ───────────────────────────────────────────
  const handleScalingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setActionFeedback(null);

    try {
      if (selectedAction === "scale_up") {
        adjustResourceCpu(targetResource.id, 25, true);
        setActionFeedback({ message: "Successfully scaled up CPU workload (+25%)." });
      } else if (selectedAction === "scale_down") {
        adjustResourceCpu(targetResource.id, -25, true);
        setActionFeedback({ message: "Successfully scaled down CPU workload (-25%)." });
      } else {
        const res = await fetch("/api/scaling/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: selectedAction, role }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "AWS Scaling action failed");
        }

        setActionFeedback({ message: data.message });
      }

      // Add to scaling decisions list
      addScalingEvent({
        id: `evt-aws-${Date.now()}`,
        resourceId: "AWS EC2 t3.micro (us-east-1)",
        policyId: "AWS-EC2-Target-CPU-70%",
        type: selectedAction === "start" || selectedAction === "scale_up" ? "scale_up" : "scale_down",
        cloudProvider: "aws",
        region: "us-east-1",
        status: "success",
        reason: `${reason} (${user?.displayName || "Operator"})`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setActionFeedback({ error: err.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // ─── Direct One-Click CPU Scale Up & Scale Down Handlers ────────────────────
  const handleQuickCpuScale = (direction: "up" | "down") => {
    if (direction === "up") {
      adjustResourceCpu(targetResource.id, 25, true);
      addScalingEvent({
        id: `evt-quick-up-${Date.now()}`,
        resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
        policyId: "Manual-Operator-Override",
        type: "scale_up",
        cloudProvider: "aws",
        region: "us-east-1",
        status: "success",
        reason: `Operator ${user?.displayName || "Admin"} triggered manual CPU scale-up (+25%).`,
        timestamp: new Date().toLocaleTimeString(),
      });
      setActionFeedback({ message: "Manual action executed: Scaled up CPU by +25%." });
    } else {
      adjustResourceCpu(targetResource.id, -25, true);
      addScalingEvent({
        id: `evt-quick-down-${Date.now()}`,
        resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
        policyId: "Manual-Operator-Override",
        type: "scale_down",
        cloudProvider: "aws",
        region: "us-east-1",
        status: "success",
        reason: `Operator ${user?.displayName || "Admin"} triggered manual CPU scale-down (-25%).`,
        timestamp: new Date().toLocaleTimeString(),
      });
      setActionFeedback({ message: "Manual action executed: Scaled down CPU by -25%." });
    }
  };

  // Simulate 95% CPU spike to trigger 5-second auto-scaling cooldown
  const handleSimulateSpike = () => {
    adjustResourceCpu(targetResource.id, 96, false);
    addScalingEvent({
      id: `evt-spike-sim-${Date.now()}`,
      resourceId: targetResource.name || "AWS EC2 t3.micro (us-east-1)",
      policyId: "Stress-Test-Simulation",
      type: "scale_up",
      cloudProvider: "aws",
      region: "us-east-1",
      status: "success",
      reason: "Simulated CPU workload surge (96%). Auto-scaling threshold exceeded.",
      timestamp: new Date().toLocaleTimeString(),
    });
    setActionFeedback({ message: "CPU load set to 96%. Auto-scaler will now step down CPU every 5 seconds!" });
  };

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Auto-Scaling Engine</h1>
          <p>Real-world EC2 capacity control, autonomous 5s threshold scaling, and policy decision logs.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="AWS Region" value="us-east-1" trend="N. Virginia Region" icon={<Server size={18} />} />
        <MetricCard
          label="Live EC2 CPU Load"
          value={`${currentCpu}%`}
          trend={currentCpu >= 90 ? "Critical Spike (>90%)" : currentCpu >= 70 ? "Warning Zone" : "Healthy Baseline"}
          icon={<Activity size={18} style={{ color: currentCpu >= 90 ? "var(--danger)" : "var(--primary)" }} />}
        />
        <MetricCard
          label="Auto-Scaling Engine"
          value={autoScalingEnabled ? (isCoolingDown ? "COOLING (5s)" : "ACTIVE") : "DISABLED"}
          trend={autoScalingEnabled ? "Threshold: 90%" : "Standby"}
          icon={<Zap size={18} style={{ color: autoScalingEnabled ? "var(--success)" : "var(--muted)" }} />}
        />
        <MetricCard label="Current Operator" value={role.toUpperCase()} trend={user?.displayName || "Authenticated"} icon={<Power size={18} />} />
      </section>

      <section className="grid two">
        {/* Scaling Events Log */}
        <div className="panel">
          <h2>Recent AWS Scaling Decisions</h2>
          <p style={{ fontSize: "12px", color: "var(--faint)", marginBottom: "14px" }}>
            Real-time decision logs generated by autonomous threshold scaling and operator commands.
          </p>
          <DataTable
            rows={scalingEvents}
            columns={[
              { key: "type", header: "Decision" },
              { key: "resourceId", header: "Resource" },
              { key: "policyId", header: "Policy" },
              { key: "region", header: "Region" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "reason", header: "Trigger Reason" },
            ]}
          />
        </div>

        {/* AWS Instance & CPU Scaling Control Panel */}
        <div className="panel">
          <h2>Direct AWS Instance & CPU Scaling Control</h2>
          <p style={{ fontSize: "12px", color: "var(--faint)", marginBottom: "14px" }}>
            Issue real-time Start, Stop, or Reboot commands, or directly scale CPU load up and down.
          </p>

          {role === "viewer" || role === "pending" || role === "developer" ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "40px 20px",
                border: "1px dashed var(--line)",
                borderRadius: "8px",
                textAlign: "center",
                color: "var(--faint)",
              }}
            >
              <Lock size={28} style={{ opacity: 0.4 }} />
              <div>
                <p style={{ fontWeight: 600, marginBottom: "4px", color: "var(--foreground)" }}>Access restricted</p>
                <p style={{ fontSize: "12px" }}>Only Operators, Admins, and Super Admins can execute AWS scaling commands.</p>
              </div>
            </div>
          ) : (
            <>
              {actionFeedback?.message && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#4ade80",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                >
                  ✓ {actionFeedback.message}
                </div>
              )}

              {actionFeedback?.error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                >
                  ⚠ {actionFeedback.error}
                </div>
              )}

              <form onSubmit={handleScalingSubmit} className="form-grid">
                <label className="field span-2">
                  Target AWS Resource
                  <select disabled>
                    <option>AWS EC2 t3.micro (us-east-1) - Connected (Current CPU: {currentCpu}%)</option>
                  </select>
                </label>

                <label className="field span-2">
                  Scaling Command Action
                  <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                    <option value="start">Start EC2 Instance (Scale Up / Boot)</option>
                    <option value="stop">Stop EC2 Instance (Scale Down / Power Off)</option>
                    <option value="reboot">Reboot EC2 Instance (Restart Service)</option>
                    <option value="scale_up">Scale Up CPU (+25% Surge)</option>
                    <option value="scale_down">Scale Down CPU (-25% Cooldown)</option>
                  </select>
                </label>

                <label className="field span-2">
                  Operator Reason
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                </label>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="button span-2"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #ff9900, #e68a00)",
                    color: "#000",
                    padding: "12px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {loadingAction ? <RotateCw size={16} className="spin" /> : <Zap size={16} />}
                  {loadingAction ? "Dispatching to AWS..." : "Execute AWS Action"}
                </button>
              </form>

              {/* ─── Direct Scale Up CPU & Scale Down CPU Buttons ──────────────── */}
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
                  Direct CPU Scaling Buttons
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleQuickCpuScale("up")}
                    className="button"
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#f87171",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                    }}
                  >
                    <TrendingUp size={16} /> Scale Up CPU (+25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCpuScale("down")}
                    className="button"
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      color: "#4ade80",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                    }}
                  >
                    <TrendingDown size={16} /> Scale Down CPU (-25%)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Autonomous 5-Second Threshold Auto-Scaling Panel ─────────────────── */}
      <section
        className="panel"
        style={{
          marginTop: "16px",
          border: isCoolingDown ? "1px solid rgba(239, 68, 68, 0.5)" : autoScalingEnabled ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid var(--border)",
          background: isCoolingDown ? "rgba(239, 68, 68, 0.04)" : autoScalingEnabled ? "rgba(59, 130, 246, 0.02)" : "inherit",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} style={{ color: isCoolingDown ? "#ef4444" : autoScalingEnabled ? "#3b82f6" : "var(--faint)" }} />
              <h2 style={{ margin: 0, fontSize: "16px" }}>Autonomous Threshold Auto-Scaling</h2>
              {isCoolingDown && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    fontWeight: 600,
                  }}
                >
                  COOLDOWN IN PROGRESS: Next Step in {cooldownCountdown}s
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--faint)" }}>
              When CPU crosses the 90% threshold, the auto-scaling engine steps down CPU load every 5 seconds until it normalizes.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setAutoScalingEnabled((prev) => !prev)}
              className="button"
              style={{
                background: autoScalingEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${autoScalingEnabled ? "rgba(34, 197, 94, 0.5)" : "var(--border)"}`,
                color: autoScalingEnabled ? "#4ade80" : "var(--text)",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              <Zap size={14} />
              {autoScalingEnabled ? "Auto-Scaling: ENABLED" : "Auto-Scaling: DISABLED"}
            </button>

            <button
              type="button"
              onClick={handleSimulateSpike}
              className="ghost-button"
              style={{
                color: "#f59e0b",
                borderColor: "rgba(245, 158, 11, 0.4)",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Flame size={14} /> Simulate 95% CPU Surge
            </button>
          </div>
        </div>

        {/* Live Auto-Scaling Telemetry Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "6px",
            background: "rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
            marginBottom: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)" }}>Current CPU Load</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: currentCpu >= 90 ? "var(--danger)" : currentCpu >= 70 ? "var(--warning)" : "var(--success)" }}>
              {currentCpu}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)" }}>Auto-Scale Threshold</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>90% CPU</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)" }}>Step-Down Frequency</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Every 5 Seconds</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)" }}>Engine Status</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: isCoolingDown ? "#ef4444" : autoScalingEnabled ? "#4ade80" : "var(--muted)" }}>
              {isCoolingDown ? `Active (-18%/5s)` : autoScalingEnabled ? "Monitoring" : "Disabled"}
            </div>
          </div>
        </div>

        {/* Visual CPU Progress Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--faint)", marginBottom: "4px" }}>
            <span>0% Safe</span>
            <span style={{ color: "#f59e0b" }}>70% Warning</span>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>90% Auto-Scale Trigger</span>
            <span>100% Max</span>
          </div>
          <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, currentCpu))}%`,
                background: currentCpu >= 90 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : currentCpu >= 70 ? "#f59e0b" : "#22c55e",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── EC2 Terminal Diagnostic & Process Commands (top -b included) ────── */}
      <section className="stress-panel" style={{ marginTop: "16px", borderTop: "2px solid var(--primary)" }}>
        <div className="section-head" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Terminal size={15} style={{ color: "var(--primary)" }} />
            <h2>EC2 Terminal Diagnostic & Process Commands</h2>
          </div>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-data)", color: "var(--faint)" }}>
            Run inside Ubuntu SSH Session
          </span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: "11px", color: "var(--faint)" }}>
          Copy and run these commands directly inside your Ubuntu EC2 terminal to monitor CPU activity or kill pinned stress loops.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                Inspect Live CPU & Process Table (top batch snapshot)
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>
                Runs top in batch mode (-b) for 1 iteration (-n 1) and outputs the first 15 lines of CPU & process load.
              </code>
            </div>
            <CopyButton text="top -b -n 1 | head -n 15" />
          </div>

          <div className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                Force Terminate All Stress Processes (Emergency Stop)
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>
                Immediately sends SIGKILL (-9) to all background yes, while loops, python, and stress processes.
              </code>
            </div>
            <CopyButton text='sudo pkill -9 yes; sudo pkill -9 -f "while true"; sudo pkill -9 python3; sudo pkill -9 stress' />
          </div>

          <div className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                Shutdown / Power Off EC2 (Inside SSH - No AWS CLI Needed)
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>
                Standard Linux system command to power off the VM immediately. AWS detects it as stopped.
              </code>
            </div>
            <CopyButton text="sudo poweroff" />
          </div>

          <div className="stress-cmd">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--text)", marginBottom: "2px" }}>
                Reboot EC2 (Inside SSH - No AWS CLI Needed)
              </div>
              <code style={{ fontSize: "10px", color: "var(--faint)" }}>
                Standard Linux command to reboot the VM directly from inside your terminal session.
              </code>
            </div>
            <CopyButton text="sudo reboot" />
          </div>
        </div>
      </section>
    </div>
  );
}
