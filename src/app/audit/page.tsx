"use client";

import { Download, LockKeyhole } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function AuditPage() {
  const { auditLogs } = useData();
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Audit & Compliance</h1>
          <p>Immutable operational logs, access activity, and export workflow.</p>
        </div>
        <ActionButton action="export-audit"><Download size={16} /> Export Audit Log</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="Integrity" value="Sealed" trend="Immutable writes enforced" icon={<LockKeyhole size={18} />} />
        <MetricCard label="Events today" value="1841" trend="Cloud Functions audited" icon={<LockKeyhole size={18} />} />
        <MetricCard label="Failures" value="0" trend="No failed auth writes" icon={<LockKeyhole size={18} />} />
        <MetricCard label="Retention" value="365d" trend="Policy compliant" icon={<LockKeyhole size={18} />} />
      </section>
      <section className="panel">
        <DataTable
          rows={auditLogs}
          columns={[
            { key: "timestamp", header: "Timestamp" },
            { key: "userEmail", header: "User" },
            { key: "action", header: "Action" },
            { key: "resource", header: "Resource" },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: "ipAddress", header: "IP Address" },
          ]}
        />
      </section>
    </div>
  );
}
