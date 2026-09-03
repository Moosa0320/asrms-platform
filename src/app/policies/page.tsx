"use client";

import { GitMerge, Save, Plus, Lock } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

import { useAuth } from "@/context/AuthContext";

export default function PoliciesPage() {
  const { policies, removePolicy } = useData();
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const canEdit = role === "admin" || role === "super_admin" || role === "operator";

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Scaling Policies</h1>
          <p>Create, configure, and resolve priority rules for automated AWS EC2 scaling.</p>
        </div>
        {canEdit && (
          <ActionButton action="create-policy">
            <Plus size={16} /> Create AWS Policy
          </ActionButton>
        )}
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
                render: (row) => canEdit ? (
                  <button
                    className="ghost-button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => removePolicy(row.id)}
                  >
                    Remove
                  </button>
                ) : <span style={{ color: "var(--faint)", fontSize: "12px" }}>Locked</span>,
              },
            ]}
          />
        </div>

        <div className="panel">
          <h2>AWS Policy Editor</h2>
          {!canEdit ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "40px 20px",
              border: "1px dashed var(--line)",
              borderRadius: "8px",
              textAlign: "center",
              color: "var(--faint)",
              marginTop: "20px"
            }}>
              <Lock size={28} style={{ opacity: 0.4 }} />
              <div>
                <p style={{ fontWeight: 600, marginBottom: "4px", color: "var(--foreground)" }}>Access restricted</p>
                <p style={{ fontSize: "12px" }}>Only Operators and Admins can edit scaling policies.</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="section-head">
          <div>
            <h2>AWS Conflict Detection &amp; Priority Engine</h2>
            <p>Evaluates policy overlaps, threshold collisions, and priority weights across AWS resources.</p>
          </div>
          {canEdit && (
            <ActionButton action="resolve-conflicts" className="ghost-button">
              <GitMerge size={16} /> Resolve Conflicts
            </ActionButton>
          )}
        </div>
      </section>
    </div>
  );
}
