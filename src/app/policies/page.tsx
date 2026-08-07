"use client";

import { GitMerge, Save } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function PoliciesPage() {
  const { policies, removePolicy } = useData();

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Scaling Policies</h1>
          <p>Create, edit, and resolve conflicts for priority-based scaling rules.</p>
        </div>
        <ActionButton action="create-policy"><Save size={16} /> Create Policy</ActionButton>
      </header>
      <section className="grid two">
        <div className="panel">
          <h2>Policy Registry</h2>
          <DataTable
            rows={policies}
            columns={[
              { key: "name", header: "Name" },
              { key: "metric", header: "Metric" },
              { key: "cloudProvider", header: "Provider" },
              { key: "thresholdUp", header: "Up" },
              { key: "thresholdDown", header: "Down" },
              { key: "priority", header: "Priority" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "id", header: "Action", render: (row) => (
                <button className="ghost-button" style={{ color: "var(--danger)" }} onClick={() => removePolicy(row.id)}>Remove</button>
              )},
            ]}
          />
        </div>
        <div className="panel">
          <h2>Policy Editor</h2>
          <div className="form-grid">
            <label className="field span-2">Name<input defaultValue="API CPU Burst Guard" /></label>
            <label className="field">Metric<select><option>cpu</option><option>memory</option><option>latency</option></select></label>
            <label className="field">Provider<select><option>aws</option><option>azure</option><option>gcp</option><option>all</option></select></label>
            <label className="field">Scale up at<input defaultValue="72" /></label>
            <label className="field">Scale down at<input defaultValue="34" /></label>
            <label className="field">Priority<input defaultValue="9" /></label>
            <label className="field">Cooldown<input defaultValue="180" /></label>
            <ActionButton action="save-policy" className="button span-2">Save Draft</ActionButton>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Conflict Detection</h2>
            <p>Cloud Function `resolveConflicts` evaluates metric overlap, provider scope, and priority.</p>
          </div>
          <ActionButton action="resolve-conflicts" className="ghost-button"><GitMerge size={16} /> Resolve Conflicts</ActionButton>
        </div>
        <div className="alert-row">
          <div><strong>No blocking conflicts</strong><p>Latency Pre-Scale overlaps AWS Burst Guard only outside provider scope.</p></div>
          <StatusBadge value="success" />
        </div>
      </section>
    </div>
  );
}
