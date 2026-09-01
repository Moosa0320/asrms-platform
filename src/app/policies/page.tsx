"use client";

import { GitMerge, Save, Plus } from "lucide-react";
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
          <h1>AWS Scaling Policies</h1>
          <p>Create, configure, and resolve priority rules for automated AWS EC2 scaling.</p>
        </div>
        <ActionButton action="create-policy">
          <Plus size={16} /> Create AWS Policy
        </ActionButton>
      </header>

      <section className="grid two">
        <div className="panel">
          <h2>Active AWS Policies</h2>
          <DataTable
            rows={policies}
            columns={[
              { key: "name", header: "Policy Name" },
              { key: "metric", header: "Metric" },
              { key: "cloudProvider", header: "Provider", render: () => "AWS" },
              { key: "thresholdUp", header: "Scale Up %" },
              { key: "thresholdDown", header: "Scale Down %" },
              { key: "priority", header: "Priority" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              {
                key: "id",
                header: "Action",
                render: (row) => (
                  <button
                    className="ghost-button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => removePolicy(row.id)}
                  >
                    Remove
                  </button>
                ),
              },
            ]}
          />
        </div>

        <div className="panel">
          <h2>AWS Policy Editor</h2>
          <div className="form-grid">
            <label className="field span-2">
              Policy Name
              <input defaultValue="AWS EC2 Dynamic Burst Guard" />
            </label>
            <label className="field">
              Target Metric
              <select>
                <option>cpu</option>
                <option>memory</option>
                <option>latency</option>
              </select>
            </label>
            <label className="field">
              Target Provider
              <select disabled>
                <option>Amazon Web Services (AWS)</option>
              </select>
            </label>
            <label className="field">
              Scale up at (%)
              <input defaultValue="70" />
            </label>
            <label className="field">
              Scale down at (%)
              <input defaultValue="30" />
            </label>
            <label className="field">
              Priority Weight
              <input defaultValue="10" />
            </label>
            <label className="field">
              Cooldown (seconds)
              <input defaultValue="180" />
            </label>
            <ActionButton action="save-policy" className="button span-2">
              Save Policy Draft
            </ActionButton>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <div>
            <h2>AWS Conflict Detection &amp; Priority Engine</h2>
            <p>Evaluates policy overlaps, threshold collisions, and priority weights across AWS resources.</p>
          </div>
          <ActionButton action="resolve-conflicts" className="ghost-button">
            <GitMerge size={16} /> Resolve Conflicts
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
