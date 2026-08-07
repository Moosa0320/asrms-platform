"use client";

import { Activity, Bell, Cpu, Database, Download, Gauge, Plus } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function DashboardPage() {
  const { alerts, cloudProviders, metricSeries, resources, scalingEvents } = useData();

  const avgCpu = Math.round(resources.reduce((sum, item) => sum + item.cpuUsage, 0) / resources.length) || 0;
  const avgMemory = Math.round(
    resources.reduce((sum, item) => sum + item.memoryUsage, 0) / resources.length,
  ) || 0;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Command Dashboard</h1>
          <p>Live resource posture, scaling activity, and cloud provider health.</p>
        </div>
        <div className="actions">
          <ActionButton action="manual-scale" className="ghost-button"><Gauge size={16} /> Manual Scale</ActionButton>
          <ActionButton action="create-policy" className="ghost-button"><Plus size={16} /> Create Policy</ActionButton>
          <ActionButton action="export-report"><Download size={16} /> Export Report</ActionButton>
        </div>
      </header>
      <section className="image-band dashboard-band">
        <div>
          <h2>Multi-cloud scaling operations center</h2>
          <p>Live policy decisions, metric streams, and compliance telemetry in one control surface.</p>
        </div>
      </section>

      <section className="grid kpis">
        <MetricCard label="Active resources" value={String(resources.length)} trend="+2 discovered today" icon={<Database size={18} />} />
        <MetricCard label="Average CPU" value={`${avgCpu}%`} trend="8% above target" icon={<Cpu size={18} />} />
        <MetricCard label="Average memory" value={`${avgMemory}%`} trend="Within policy envelope" icon={<Activity size={18} />} />
        <MetricCard label="Open alerts" value={String(alerts.filter((alert) => !alert.acknowledged).length)} trend="2 require operator action" icon={<Bell size={18} />} />
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="section-head">
            <div>
              <h2>Realtime Metrics</h2>
              <p>CPU, memory, network, and latency aggregated from Realtime Database.</p>
            </div>
            <StatusBadge value="active" />
          </div>
          <LiveChart data={metricSeries} keys={["cpu", "memory", "network", "latency"]} kind="area" />
        </div>
        <div className="panel">
          <div className="section-head">
            <div>
              <h2>Provider Status</h2>
              <p>API health checks and latency by integration.</p>
            </div>
          </div>
          <div className="settings-list">
            {cloudProviders.map((provider) => (
              <div className="setting-row" key={provider.id}>
                <div>
                  <strong>{provider.displayName}</strong>
                  <p>{provider.region} / {provider.apiLatency} ms</p>
                </div>
                <StatusBadge value={provider.status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Recent Scaling Events</h2>
          <StatusBadge value="active" />
        </div>
        <DataTable
          rows={scalingEvents}
          columns={[
            { key: "id", header: "Event" },
            { key: "type", header: "Type" },
            { key: "resourceId", header: "Resource" },
            { key: "cloudProvider", header: "Provider" },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: "reason", header: "Reason" },
            { key: "timestamp", header: "Time" },
          ]}
        />
      </section>
    </div>
  );
}
