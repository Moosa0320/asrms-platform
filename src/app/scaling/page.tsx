"use client";

import { Pause, Play, Zap } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function ScalingPage() {
  const { resources, scalingEvents } = useData();
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Auto-Scaling Engine</h1>
          <p>Automated decisions, cooldown visibility, and manual operator overrides.</p>
        </div>
        <div className="actions">
          <ActionButton action="pause-engine" className="ghost-button"><Pause size={16} /> Pause Engine</ActionButton>
          <ActionButton action="manual-scale"><Zap size={16} /> Manual Override</ActionButton>
        </div>
      </header>
      <section className="grid kpis">
        <MetricCard label="Engine state" value="Active" trend="All functions healthy" icon={<Play size={18} />} />
        <MetricCard label="Cooldown queue" value="3" trend="Next release in 72 sec" icon={<Pause size={18} />} />
        <MetricCard label="Scale-ups today" value="18" trend="+11% vs yesterday" icon={<Zap size={18} />} />
        <MetricCard label="Failure rate" value="0.7%" trend="Within SLO" icon={<Zap size={18} />} />
      </section>
      <section className="grid two">
        <div className="panel">
          <h2>Recent Scaling Decisions</h2>
          <DataTable
            rows={scalingEvents}
            columns={[
              { key: "type", header: "Decision" },
              { key: "resourceId", header: "Resource" },
              { key: "policyId", header: "Policy" },
              { key: "region", header: "Region" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "reason", header: "Trigger" },
            ]}
          />
        </div>
        <div className="panel">
          <h2>Manual Override</h2>
          <div className="form-grid">
            <label className="field span-2">Resource<select>{resources.map((resource) => <option key={resource.id}>{resource.name}</option>)}</select></label>
            <label className="field">Action<select><option>Scale up +2 instances</option><option>Scale down -1 instance</option><option>Hold capacity</option></select></label>
            <label className="field">Cooldown<input defaultValue="180 seconds" /></label>
            <label className="field span-2">Reason<textarea defaultValue="Operator override for traffic surge." /></label>
            <ActionButton action="submit-override" className="button span-2">Submit Override</ActionButton>
          </div>
        </div>
      </section>
    </div>
  );
}
