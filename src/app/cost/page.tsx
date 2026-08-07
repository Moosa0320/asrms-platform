"use client";

import { Download, DollarSign } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { useData } from "@/context/DataContext";

export default function CostPage() {
  const { costRecords } = useData();
  const current = costRecords[costRecords.length - 1];
  const total = current.aws + current.azure + current.gcp;

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Cost Management</h1>
          <p>Monthly cloud spend, service breakdown, budget thresholds, and exportable reports.</p>
        </div>
        <ActionButton action="export-cost"><Download size={16} /> Export CSV</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="This month" value={`PKR ${Math.round(total / 1000000)}M`} trend="Projected under budget" icon={<DollarSign size={18} />} />
        <MetricCard label="Compute" value={`PKR ${Math.round(current.compute / 1000000)}M`} trend="64% of spend" icon={<DollarSign size={18} />} />
        <MetricCard label="Storage" value={`PKR ${Math.round(current.storage / 1000000)}M`} trend="Stable" icon={<DollarSign size={18} />} />
        <MetricCard label="Network" value={`PKR ${Math.round(current.network / 1000000)}M`} trend="+6% month over month" icon={<DollarSign size={18} />} />
      </section>
      <section className="grid two">
        <div className="panel">
          <h2>Provider Spend</h2>
          <LiveChart data={costRecords.map((row) => ({ time: row.month, aws: row.aws, azure: row.azure, gcp: row.gcp }))} keys={["aws", "azure", "gcp"]} kind="bar" />
        </div>
        <div className="panel">
          <h2>Service Trend</h2>
          <LiveChart data={costRecords.map((row) => ({ time: row.month, compute: row.compute, storage: row.storage, network: row.network }))} keys={["compute", "storage", "network"]} />
        </div>
      </section>
    </div>
  );
}
