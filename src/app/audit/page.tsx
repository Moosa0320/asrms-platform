"use client";

import { useEffect, useState } from "react";
import { Download, LockKeyhole } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function AuditPage() {
  const { auditLogs, addAuditLog } = useData();
  const [ipResolved, setIpResolved] = useState(false);

  useEffect(() => {
    if (!ipResolved) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data.ip) {
            const now = new Date();
            addAuditLog({
              id: `log-${Math.floor(Math.random() * 10000)}`,
              timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
              userEmail: "current_user", // This would normally come from AuthContext
              action: `LOGGED_IN_FROM_${data.city?.toUpperCase()}_${data.country_code}`,
              resource: "System",
              status: "success",
              ipAddress: data.ip
            });
            setIpResolved(true);
          }
        })
        .catch(console.error);
    }
  }, [ipResolved, addAuditLog]);

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
