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
  const { loading } = useAuth();

  if (pathname === "/login") return <>{children}</>;

  if (loading) {
    return <div className="boot-screen">Initializing ASRMS control plane...</div>;
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
