import { Save, Settings } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { seedManifest } from "@/lib/seed";

const settings = [
  ["Default cooldown period", "180 seconds"],
  ["Metric retention policy", "90 days"],
  ["Alert threshold defaults", "CPU 72%, Memory 80%, Latency 120 ms"],
  ["Budget limit", "PKR 25,200,000 / month"],
  ["Notification services", "Email, Slack, PagerDuty"],
];

export default function SettingsPage() {
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>System Settings</h1>
          <p>Global configuration for scaling behavior, retention, notification services, and budgets.</p>
        </div>
        <ActionButton action="save-settings"><Save size={16} /> Save Settings</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="Seeded users" value={String(seedManifest.users)} trend="Demo accounts ready" icon={<Settings size={18} />} />
        <MetricCard label="Policies" value={String(seedManifest.policies)} trend="Conflict engine ready" icon={<Settings size={18} />} />
        <MetricCard label="Resources" value={String(seedManifest.resources)} trend="Inventory seeded" icon={<Settings size={18} />} />
        <MetricCard label="Firebase mode" value="Demo" trend="Env vars enable live backend" icon={<Settings size={18} />} />
      </section>
      <section className="grid two">
        <div className="panel">
          <h2>System Config</h2>
          <div className="settings-list">
            {settings.map(([label, value]) => (
              <div className="setting-row" key={label}>
                <div>
                  <strong>{label}</strong>
                  <p>{value}</p>
                </div>
                <StatusBadge value="active" />
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Cloud Function Health</h2>
          <div className="settings-list">
            {["onMetricWrite", "resolveConflicts", "dispatchAlert", "generateForecast", "generateCostReport", "auditLogger"].map((fn) => (
              <div className="setting-row" key={fn}>
                <strong>{fn}</strong>
                <StatusBadge value="success" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
