"use client";

import { RefreshCw, Server } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function ResourcesPage() {
  const { resources } = useData();
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Resource Inventory</h1>
          <p>Discovered compute, container, function, and database assets with current telemetry.</p>
        </div>
        <ActionButton action="refresh-discovery"><RefreshCw size={16} /> Refresh Discovery</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="Resources" value={String(resources.length)} trend="Synced across providers" icon={<Server size={18} />} />
        <MetricCard label="Healthy" value={String(resources.filter((resource) => resource.status === "healthy").length)} trend="No action required" icon={<Server size={18} />} />
        <MetricCard label="Warning" value={String(resources.filter((resource) => resource.status === "warning").length)} trend="Policy watch active" icon={<Server size={18} />} />
        <MetricCard label="Critical" value={String(resources.filter((resource) => resource.status === "critical").length)} trend="Scaling in progress" icon={<Server size={18} />} />
      </section>
      <section className="panel">
        <DataTable
          rows={resources}
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "type", header: "Type" },
            { key: "cloudProvider", header: "Provider" },
            { key: "region", header: "Region" },
            { key: "cpuUsage", header: "CPU", render: (row) => `${row.cpuUsage}%` },
            { key: "memoryUsage", header: "Memory", render: (row) => `${row.memoryUsage}%` },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: "lastSyncAt", header: "Last Sync" },
          ]}
        />
      </section>
    </div>
  );
}
