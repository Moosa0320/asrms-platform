"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { AppActionsProvider } from "@/context/AppActionsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (pathname === "/login") return <>{children}</>;

  if (loading) {
    return <div className="boot-screen">Initializing ASRMS control plane...</div>;
  }

  if (user?.role === "pending") {
    return (
      <main className="login-page">
        <section className="login-panel" style={{ textAlign: "center", maxWidth: "480px", padding: "3rem" }}>
          <div className="login-copy" style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", color: "var(--warning)" }}>Approval Pending</h1>
            <p style={{ margin: "1rem 0 1.5rem" }}>
              Your account registration is successful. However, access to the control plane requires approval from a Super Admin.
            </p>
            <div style={{ padding: "1rem", borderRadius: "8px", background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.15)", fontSize: "0.9rem", color: "var(--warning)" }}>
              Account: <strong>{user.email}</strong>
            </div>
          </div>
          <button className="button" style={{ width: "100%" }} onClick={logout}>
            Sign Out
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <TopBar />
        <div className="workspace__content">{children}</div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppActionsProvider>
          <ShellInner>{children}</ShellInner>
        </AppActionsProvider>
      </DataProvider>
    </AuthProvider>
  );
}
