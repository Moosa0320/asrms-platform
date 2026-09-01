"use client";

import { useState } from "react";
import { Pause, Play, Zap, Power, RotateCw, Server, AlertCircle } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { WebTerminal } from "@/components/WebTerminal";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

export default function ScalingPage() {
  const { resources, scalingEvents, addScalingEvent } = useData();
  const { user } = useAuth();
  const role = user?.role || "viewer";

  const [selectedAction, setSelectedAction] = useState("start");
  const [reason, setReason] = useState("Manual operator override for capacity load adjustment.");
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message?: string; error?: string } | null>(null);

  const handleScalingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setActionFeedback(null);

    try {
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

      // Add to scaling decisions list
      addScalingEvent({
        id: `scale-${Date.now()}`,
        resourceId: "AWS EC2 t3.micro (us-east-1)",
        policyId: "Manual-Operator-Policy",
        type: selectedAction === "start" || selectedAction === "scale_up" ? "scale_up" : "scale_down",
        timestamp: new Date().toLocaleTimeString(),
        reason: `${reason} (${user?.displayName || "User"})`,
        status: "success",
        region: "us-east-1",
      });
    } catch (err: any) {
      setActionFeedback({ error: err.message });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Auto-Scaling Engine</h1>
          <p>Real-world EC2 instance capacity control, automated policies, and Web Terminal operator console.</p>
        </div>
        <div className="actions">
          <ActionButton action="pause-engine" className="ghost-button">
            <Pause size={16} /> Engine Active
          </ActionButton>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="AWS Region" value="us-east-1" trend="Connected & Healthy" icon={<Server size={18} />} />
        <MetricCard label="Target Resource" value="EC2 t3.micro" trend="AWS Cloud Machine" icon={<Play size={18} />} />
        <MetricCard label="Scaling Policy" value="Target CPU 70%" trend="Active Rule" icon={<Zap size={18} />} />
        <MetricCard label="Operator Role" value={role.toUpperCase()} trend={user?.displayName || "Authenticated"} icon={<Power size={18} />} />
      </section>

      {/* Web Terminal Section */}
      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="section-head">
          <h2>Cloud Command Terminal (Web SSH)</h2>
          <p>Run real-time diagnostics, check process uptime, or dispatch simulated traffic surge signals to AWS.</p>
        </div>
        <WebTerminal defaultCommand="status" />
      </section>

      <section className="grid two">
        {/* Scaling Events Log */}
        <div className="panel">
          <h2>Recent Cloud Scaling Decisions</h2>
          <DataTable
            rows={scalingEvents}
            columns={[
              { key: "type", header: "Decision" },
              { key: "resourceId", header: "Resource" },
              { key: "policyId", header: "Policy" },
              { key: "region", header: "Region" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "reason", header: "Trigger" },
            ]}
          />
        </div>

        {/* AWS Scaling Action Form */}
        <div className="panel">
          <h2>Direct AWS Instance Control</h2>
          <p style={{ fontSize: "12px", color: "var(--faint)", marginBottom: "14px" }}>
            Issue real-time Start, Stop, or Reboot commands directly to your connected AWS EC2 instance.
          </p>

          {actionFeedback?.message && (
            <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", fontSize: "13px", marginBottom: "14px" }}>
              ✓ {actionFeedback.message}
            </div>
          )}

          {actionFeedback?.error && (
            <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: "13px", marginBottom: "14px" }}>
              ⚠ {actionFeedback.error}
            </div>
          )}

          <form onSubmit={handleScalingSubmit} className="form-grid">
            <label className="field span-2">
              Cloud Resource Target
              <select disabled>
                <option>AWS EC2 t3.micro (us-east-1) - Live Connected</option>
              </select>
            </label>

            <label className="field span-2">
              Action Command
              <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                <option value="start">▶ Start EC2 Instance (Scale Up / Boot)</option>
                <option value="stop">⏹ Stop EC2 Instance (Scale Down / Power Off)</option>
                <option value="reboot">🔄 Reboot EC2 Instance (Restart Service)</option>
              </select>
            </label>

            <label className="field span-2">
              Operator Reason
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
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
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                padding: "12px",
                fontWeight: 600,
                borderRadius: "8px",
              }}
            >
              {loadingAction ? <RotateCw size={16} className="spin" /> : <Zap size={16} />}
              {loadingAction ? "Dispatching to AWS..." : "Execute AWS Action"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
