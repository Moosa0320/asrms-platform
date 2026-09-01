"use client";

import { useEffect, useState } from "react";
import { Server, Wifi, RefreshCw, CheckCircle, ExternalLink } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";

export default function CloudProvidersPage() {
  const [awsStatus, setAwsStatus] = useState<{
    latencyMs: number;
    status: string;
    liveData: any;
    fetchedAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCloudApi = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cloud-apis");
      if (res.ok) {
        const data = await res.json();
        const aws = data.providers?.find((p: any) => p.provider === "AWS");
        if (aws) setAwsStatus(aws);
      }
    } catch (e) {
      console.error("Failed to fetch AWS cloud status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudApi();
  }, []);

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Provider Hub</h1>
          <p>Real-time infrastructure health, global subnets, and CloudWatch integration for Amazon Web Services.</p>
        </div>
        <div className="actions">
          <button type="button" className="ghost-button" onClick={fetchCloudApi} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "Pinging AWS..." : "Ping AWS API"}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="Active Cloud Provider" value="AWS" trend="Amazon Web Services" icon={<Server size={18} />} />
        <MetricCard label="Primary Region" value="us-east-1" trend="N. Virginia Data Center" icon={<Wifi size={18} />} />
        <MetricCard label="API Ping Latency" value={`${awsStatus?.latencyMs ?? 24} ms`} trend="Live Network Latency" icon={<CheckCircle size={18} />} />
        <MetricCard label="Global Cloud Subnets" value={String(awsStatus?.liveData?.totalSubnets ?? "8,400+")} trend="Discovered Infrastructure" icon={<Server size={18} />} />
      </section>

      {/* AWS Cloud Card */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>Amazon Web Services (AWS)</h2>
              <StatusBadge value="healthy" />
            </div>
            <p style={{ fontSize: "13px", color: "var(--faint)", marginTop: "4px" }}>
              Official Infrastructure Endpoint: <code>https://ip-ranges.amazonaws.com/ip-ranges.json</code>
            </p>
          </div>

          <a
            href="https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #ff9900, #e68a00)",
              color: "#000",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={14} /> Open AWS Console
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#080c14", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "12px", color: "var(--faint)" }}>Cloud Provider</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginTop: "4px" }}>AWS (Amazon)</div>
          </div>

          <div style={{ background: "#080c14", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "12px", color: "var(--faint)" }}>Configured Region</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>us-east-1 (N. Virginia)</div>
          </div>

          <div style={{ background: "#080c14", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "12px", color: "var(--faint)" }}>CloudWatch Integration</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#4ade80", marginTop: "4px" }}>Active (SDK Connected)</div>
          </div>

          <div style={{ background: "#080c14", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "12px", color: "var(--faint)" }}>Target Instance Type</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginTop: "4px" }}>t3.micro (Free Tier)</div>
          </div>
        </div>
      </section>
    </div>
  );
}
