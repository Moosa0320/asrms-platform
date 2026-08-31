"use client";

import { useEffect, useState } from "react";
import { Download, LockKeyhole, MapPin } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

interface GeoInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  timezone: string;
}

export default function AuditPage() {
  const { auditLogs, addAuditLog } = useData();
  const { user } = useAuth();
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [ipResolved, setIpResolved] = useState(false);

  useEffect(() => {
    if (!ipResolved) {
      fetch("/api/geolocation")
        .then((res) => res.json())
        .then((data) => {
          if (data.ip) {
            setGeoInfo(data);
            const now = new Date();
            addAuditLog({
              id: `log-${Math.floor(Math.random() * 10000)}`,
              timestamp: now.toISOString().replace("T", " ").substring(0, 19),
              userEmail: user?.email || "current_user",
              action: `LOGIN_FROM_${data.city?.toUpperCase().replace(/\s+/g, "_") || "UNKNOWN"}_${data.country_code || ""}`,
              resource: "auth/session",
              status: "success",
              ipAddress: data.ip,
            });
            setIpResolved(true);
          }
        })
        .catch(console.error);
    }
  }, [ipResolved, addAuditLog, user?.email]);

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Audit &amp; Compliance</h1>
          <p>Immutable operational logs with IP geolocation, access activity, and export workflow.</p>
        </div>
        <ActionButton action="export-audit"><Download size={16} /> Export Audit Log</ActionButton>
      </header>

      <section className="grid kpis">
        <MetricCard label="Integrity" value="Sealed" trend="Immutable writes enforced" icon={<LockKeyhole size={18} />} />
        <MetricCard label="Events logged" value={String(auditLogs.length)} trend="Real-time audit stream" icon={<LockKeyhole size={18} />} />
        <MetricCard label="Failures" value="0" trend="No failed auth writes" icon={<LockKeyhole size={18} />} />
        <MetricCard
          label="Your Location"
          value={geoInfo ? `${geoInfo.city || "?"}` : "Resolving…"}
          trend={geoInfo ? `${geoInfo.region}, ${geoInfo.country_name} · ${geoInfo.org}` : "Fetching from ipapi.co"}
          icon={<MapPin size={18} />}
        />
      </section>

      {geoInfo && (
        <section className="panel" style={{ marginBottom: "16px", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <MapPin size={16} style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 600 }}>Session Origin:</span>
            <span style={{ color: "var(--faint)" }}>
              {geoInfo.ip} · {geoInfo.city}, {geoInfo.region}, {geoInfo.country_name} · 
              TZ: {geoInfo.timezone} · ISP: {geoInfo.org}
            </span>
          </div>
        </section>
      )}

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
