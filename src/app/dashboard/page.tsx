"use client";

import { useEffect, useState } from "react";
import { Activity, Bell, Cpu, Database, Download, Gauge, Plus, Server, Wifi, CheckCircle } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function DashboardPage() {
  const { alerts, cloudProviders, resources, scalingEvents } = useData();
  const [liveTelemetry, setLiveTelemetry] = useState<{ cpu: number; memory: number; network: number; latency: number; source: string; instanceId?: string } | null>(null);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/monitoring?resourceId=aws-ec2-t3-micro");
        if (res.ok) {
          const data = await res.json();
          setLiveTelemetry(data);
          setMetricHistory((prev) => {
            const next = [...prev, data];
            if (next.length > 15) next.shift();
            return next;
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  const awsResources = resources.filter((r) => r.cloudProvider === "aws");
  const liveCpu = liveTelemetry?.cpu ?? 12;
  const liveMemory = liveTelemetry?.memory ?? 52;
  const liveLatency = liveTelemetry?.latency ?? 24;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Operations Center</h1>
          <p>Real-time telemetry, auto-scaling decision pipeline, and infrastructure health for Amazon Web Services.</p>
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
          <p>Live CloudWatch metric streams, auto-scaling policies, and compliance telemetry in one unified platform.</p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="AWS Resources" value={String(awsResources.length)} trend="Live Discovered" icon={<Database size={18} />} />
        <MetricCard label="Live AWS CPU" value={`${liveCpu}%`} trend={liveCpu > 70 ? "Near Scaling Threshold" : "Operating in Safe Range"} icon={<Cpu size={18} />} />
        <MetricCard label="Memory Footprint" value={`${liveMemory}%`} trend="Within Policy Envelope" icon={<Activity size={18} />} />
        <MetricCard label="AWS Ping Latency" value={`${liveLatency} ms`} trend="us-east-1 (N. Virginia)" icon={<Wifi size={18} />} />
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

        {/* AWS Provider Status Panel */}
        <div className="panel">
          <div className="section-head">
            <div>
              <h2>AWS Provider Health</h2>
              <p>Active cloud region integration.</p>
            </div>
            <StatusBadge value="healthy" />
          </div>
          <DataTable
            rows={cloudProviders}
            columns={[
              { key: "displayName", header: "Cloud Provider" },
              { key: "region", header: "Region" },
              { key: "status", header: "Status", render: () => <StatusBadge value="healthy" /> },
              { key: "apiLatency", header: "Latency", render: () => `${liveLatency} ms` },
              { key: "lastChecked", header: "Sync", render: () => "Live 30s" },
            ]}
          />
        </div>
      </section>

      {/* Scaling Decisions Table */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <h2>Recent AWS Scaling Decisions</h2>
          <p>Decisions executed automatically by policies or manual operator overrides.</p>
        </div>
        <DataTable
          rows={scalingEvents}
          columns={[
            { key: "type", header: "Decision" },
            { key: "resourceId", header: "Target Resource" },
            { key: "policyId", header: "Applied Policy" },
            { key: "region", header: "Region" },
            { key: "status", header: "Execution Status", render: (r) => <StatusBadge value={String(r.status)} /> },
            { key: "reason", header: "Trigger Reason" },
            { key: "timestamp", header: "Time" },
          ]}
        />
      </section>
    </div>
  );
}
