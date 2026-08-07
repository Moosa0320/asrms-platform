"use client";

import { UserPlus, Users } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function UsersPage() {
  const { users: demoUsers, permissionMatrix, removeUser } = useData();

  const users = demoUsers.map((user) => ({
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
  }));

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
        <MetricCard label="Total users" value={String(users.length)} trend="4 seeded personas" icon={<Users size={18} />} />
        <MetricCard label="Admins" value="1" trend="Full access" icon={<Users size={18} />} />
        <MetricCard label="Operators" value="1" trend="Override access" icon={<Users size={18} />} />
        <MetricCard label="Inactive" value="1" trend="Developer account disabled" icon={<Users size={18} />} />
      </section>
      <section className="grid two">
        <div className="panel">
          <h2>Users</h2>
          <DataTable
            rows={users}
            columns={[
              { key: "displayName", header: "Name" },
              { key: "email", header: "Email" },
              { key: "role", header: "Role", render: (row) => <StatusBadge value={String(row.role)} /> },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: "lastLogin", header: "Last Login" },
              { key: "uid", header: "Action", render: (row) => (
                <button className="ghost-button" style={{ color: "var(--danger)" }} onClick={() => removeUser(row.uid)}>Remove</button>
              )},
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
