"use client";

import { Server, Plus, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

export default function ResourcesPage() {
  const { resources } = useData();
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const canRefresh = role === "admin" || role === "super_admin" || role === "operator";

  // AWS-Only Resources
  const awsResources = resources.filter((r) => r.cloudProvider === "aws");

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Resource Inventory</h1>
          <p>Live inventory of your connected Amazon Web Services EC2 instances, EBS volumes, and Auto-Scaling Groups.</p>
        </div>
        {canRefresh && (
          <div className="actions">
            <ActionButton action="refresh-discovery">
              <RefreshCw size={16} /> Refresh AWS Discovery
            </ActionButton>
          </div>
        )}
      </header>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="AWS Resources" value={String(awsResources.length)} trend="Live Discovered" icon={<Server size={18} />} />
        <MetricCard label="Primary Region" value="us-east-1" trend="N. Virginia" icon={<Server size={18} />} />
        <MetricCard label="Cloud Health" value="100%" trend="All AWS Services Normal" icon={<Server size={18} />} />
        <MetricCard label="Cloud Provider" value="AWS" trend="SDK Connected" icon={<Server size={18} />} />
      </section>

      {/* Resource Table */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <h2>Discovered AWS Infrastructure</h2>
          <p>Real-time telemetry and resource state from AWS CloudWatch.</p>
        </div>
        <DataTable
          rows={awsResources}
          columns={[
            { key: "name", header: "Resource Name" },
            { key: "type", header: "Resource Type" },
            { key: "cloudProvider", header: "Provider", render: () => "AWS" },
            { key: "region", header: "Region" },
            { key: "cpuUsage", header: "CPU", render: (row) => `${row.cpuUsage}%` },
            { key: "memoryUsage", header: "Memory", render: (row) => `${row.memoryUsage}%` },
            { key: "status", header: "Health", render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: "lastSyncAt", header: "Last Telemetry Sync" },
          ]}
        />
      </section>
    </div>
  );
}
