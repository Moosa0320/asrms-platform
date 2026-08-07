"use client";

import { Cloud, PlugZap } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function CloudProvidersPage() {
  const { cloudProviders, removeProvider } = useData();
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Cloud Providers</h1>
          <p>Manage multi-cloud integrations, API health, encrypted credentials, and regional coverage.</p>
        </div>
        <ActionButton action="add-provider"><PlugZap size={16} /> Add Provider</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="Connected providers" value="2/3" trend="GCP has elevated latency" icon={<Cloud size={18} />} />
        <MetricCard label="Avg API latency" value="94 ms" trend="16 ms above target" icon={<Cloud size={18} />} />
        <MetricCard label="Regions covered" value="4" trend="US and EU active" icon={<Cloud size={18} />} />
        <MetricCard label="Credential state" value="Sealed" trend="All encrypted at rest" icon={<PlugZap size={18} />} />
      </section>
      <section className="grid three">
        {cloudProviders.map((provider) => (
          <article className="provider-card" key={provider.id}>
            <header>
              <div>
                <h2>{provider.displayName}</h2>
                <p>{provider.provider.toUpperCase()} / {provider.region}</p>
              </div>
              <StatusBadge value={provider.status} />
            </header>
            <div>
              <p>API latency</p>
              <strong>{provider.apiLatency} ms</strong>
              <div className="progress"><span style={{ width: `${Math.min(provider.apiLatency / 2, 100)}%` }} /></div>
            </div>
            <div className="provider-row">
              <StatusBadge value={provider.enabled ? "active" : "inactive"} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{provider.lastChecked}</span>
                <button 
                  type="button" 
                  className="ghost-button" 
                  style={{ color: "var(--danger)" }}
                  onClick={() => removeProvider(provider.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
