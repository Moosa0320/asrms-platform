"use client";

import { UserPlus, Users, Check, X, ShieldAlert, Crown } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { updateRecord } from "@/lib/firestore";

export default function UsersPage() {
  const { users: allUsers, permissionMatrix, removeUser } = useData();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.email === "moosashahid0320@gmail.com";

  // Separate pending and active users
  const pendingUsers = allUsers.filter((u) => u.role === "pending");
  const activeUsers = allUsers.filter((u) => u.role !== "pending");

  async function handleApprove(uid: string) {
    try {
      await updateRecord("users", uid, { role: "admin" });
    } catch (err) {
      console.error("Failed to approve user:", err);
    }
  }

  async function handleReject(uid: string) {
    try {
      // Rejecting pending admin requests sets their role to viewer
      await updateRecord("users", uid, { role: "viewer" });
    } catch (err) {
      console.error("Failed to reject user:", err);
    }
  }

  async function handlePromote(uid: string) {
    try {
      await updateRecord("users", uid, { role: "admin" });
    } catch (err) {
      console.error("Failed to promote user:", err);
    }
  }

  async function handleDemote(uid: string) {
    try {
      await updateRecord("users", uid, { role: "viewer" });
    } catch (err) {
      console.error("Failed to demote user:", err);
    }
  }

  async function handleRemove(targetUser: typeof allUsers[0]) {
    if (currentUser?.uid === targetUser.uid) {
      alert("You cannot remove yourself from the system.");
      return;
    }

    const isAdmin = currentUser?.role === "admin" || isSuperAdmin;
    if (!isAdmin) {
      alert("You do not have permission to remove users.");
      return;
    }

    if (currentUser?.role === "admin" && !isSuperAdmin) {
      const isTargetAdmin = targetUser.role === "admin" || targetUser.role === "super_admin" || targetUser.email === "moosashahid0320@gmail.com";
      if (isTargetAdmin) {
        alert("Admins cannot remove other administrators or the system owner.");
        return;
      }
    }

    if (confirm(`Are you sure you want to completely remove ${targetUser.displayName} (${targetUser.email}) from the system?`)) {
      try {
        await removeUser(targetUser.uid);
      } catch (err) {
        console.error("Failed to remove user:", err);
      }
    }
  }

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>User & Role Management</h1>
          <p>Seeded accounts, role assignments, deactivation controls, and RBAC matrix.</p>
        </div>
        <ActionButton action="create-user"><UserPlus size={16} /> Create User</ActionButton>
      </header>

      <section className="grid kpis">
        <MetricCard label="Total active users" value={String(activeUsers.length)} trend="Live from Firebase" icon={<Users size={18} />} />
        <MetricCard label="Super Admins" value={String(allUsers.filter(u => u.role === "super_admin" || u.email === "moosashahid0320@gmail.com").length)} trend="Owner" icon={<Crown size={18} style={{ color: "#a855f7" }} />} />
        <MetricCard label="Admins" value={String(allUsers.filter(u => u.role === "admin").length)} trend="Full access" icon={<Users size={18} />} />
        <MetricCard label="Pending Approval" value={String(pendingUsers.length)} trend="Awaiting Super Admin" icon={<ShieldAlert size={18} style={{ color: pendingUsers.length > 0 ? "var(--warning)" : "inherit" }} />} />
      </section>

      {isSuperAdmin && pendingUsers.length > 0 && (
        <section className="panel" style={{ border: "1px solid var(--warning)", background: "rgba(245, 158, 11, 0.03)", marginBottom: "16px" }}>
          <h2 style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <ShieldAlert size={20} /> Pending Admin Approvals
          </h2>
          <DataTable
            rows={pendingUsers}
            columns={[
              { key: "displayName", header: "Name" },
              { key: "email", header: "Email" },
              { key: "role", header: "Requested Role", render: () => <StatusBadge value="Admin" /> },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              {
                key: "uid",
                header: "Actions",
                render: (row) => (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="button"
                      style={{ padding: "4px 10px", fontSize: "12px", background: "var(--success)" }}
                      onClick={() => handleApprove(row.uid)}
                    >
                      <Check size={14} style={{ marginRight: "4px" }} /> Approve
                    </button>
                    <button
                      className="ghost-button"
                      style={{ padding: "4px 10px", fontSize: "12px", color: "var(--critical)", borderColor: "var(--critical)" }}
                      onClick={() => handleReject(row.uid)}
                    >
                      <X size={14} style={{ marginRight: "4px" }} /> Reject
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      <section className="grid two">
        <div className="panel">
          <h2>Active Users</h2>
          <DataTable
            rows={activeUsers}
            columns={[
              { 
                key: "displayName", 
                header: "Name",
                render: (row) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {row.email === "moosashahid0320@gmail.com" && <Crown size={14} style={{ color: "#a855f7" }} />}
                    <span>{row.displayName}</span>
                  </div>
                )
              },
              { key: "email", header: "Email" },
              { 
                key: "role", 
                header: "Role", 
                render: (row) => {
                  const isMoosa = row.email === "moosashahid0320@gmail.com";
                  return <StatusBadge value={isMoosa ? "super_admin" : String(row.role)} />;
                } 
              },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "lastLogin", header: "Last Login" },
              {
                key: "uid",
                header: "Action",
                render: (row) => {
                  const isMoosa = row.email === "moosashahid0320@gmail.com";
                  if (isMoosa) return <span style={{ fontSize: "12px", color: "var(--faint)" }}>System Owner</span>;
                  
                  const canRemove = currentUser?.uid !== row.uid && (
                    isSuperAdmin || (
                      currentUser?.role === "admin" &&
                      row.role !== "admin" &&
                      row.role !== "super_admin" &&
                      row.email !== "moosashahid0320@gmail.com"
                    )
                  );

                  return (
                    <div style={{ display: "flex", gap: "8px" }}>
                      {isSuperAdmin && (
                        <>
                          {row.role !== "admin" ? (
                            <button 
                              className="ghost-button" 
                              style={{ color: "var(--primary)", borderColor: "var(--primary)", padding: "2px 8px", fontSize: "11px" }}
                              onClick={() => handlePromote(row.uid)}
                            >
                              Promote to Admin
                            </button>
                          ) : (
                            <button 
                              className="ghost-button" 
                              style={{ color: "var(--warning)", borderColor: "var(--warning)", padding: "2px 8px", fontSize: "11px" }}
                              onClick={() => handleDemote(row.uid)}
                            >
                              Demote to Viewer
                            </button>
                          )}
                        </>
                      )}
                      {canRemove && (
                        <button 
                          className="ghost-button" 
                          style={{ color: "var(--danger)", padding: "2px 8px", fontSize: "11px" }} 
                          onClick={() => handleRemove(row)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                }
              },
            ]}
          />
        </div>
        <div className="panel">
          <h2>Role Permission Matrix</h2>
          <DataTable rows={permissionMatrix} columns={Object.keys(permissionMatrix[0]).map((key) => ({ key, header: key }))} />
        </div>
      </section>
    </div>
  );
}
