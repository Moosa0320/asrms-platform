"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, LogOut, Search, X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppActions } from "@/context/AppActionsContext";
import { useData } from "@/context/DataContext";
import { StatusBadge } from "./StatusBadge";

export function TopBar() {
  const { alerts, users: demoUsers, policies, resources } = useData();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    openNotifications,
    setOpenNotifications,
    acknowledgeNotification,
    markAllRead,
  } = useAppActions();

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [
      ...resources.map((item) => ({
        label: item.name,
        meta: `${item.cloudProvider.toUpperCase()} resource`,
        href: "/resources",
      })),
      ...policies.map((item) => ({
        label: item.name,
        meta: `${item.metric} policy`,
        href: "/policies",
      })),
      ...alerts.map((item) => ({
        label: item.title,
        meta: `${item.severity} alert`,
        href: "/alerts",
      })),
      ...demoUsers.map((item) => ({
        label: item.displayName,
        meta: `${item.role} user`,
        href: "/users",
      })),
    ]
      .filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [query]);

  const profile = demoUsers.find((item) => item.email === user?.email);

  return (
    <header className="topbar">
      <label className="search">
        <Search size={16} />
        <input
          placeholder="Search resources, policies, alerts, users"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button className="clear-search" type="button" title="Clear search" onClick={() => setQuery("")}>
            <X size={14} />
          </button>
        )}
        {query && (
          <div className="search-results">
            {searchResults.length ? (
              searchResults.map((item) => (
                <Link href={item.href} key={`${item.href}-${item.label}`} onClick={() => setQuery("")}>
                  <strong>{item.label}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">No matching records found.</div>
            )}
          </div>
        )}
      </label>

      <div className="topbar__right">
        <button
          className="icon-button notification-button"
          title="Notifications"
          type="button"
          onClick={() => setOpenNotifications(!openNotifications)}
        >
          <Bell size={18} />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
        {openNotifications && (
          <section className="popover notifications-popover">
            <header style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <Bell size={15} style={{ color: "var(--primary)" }} />
                <h3 style={{ color: "#F1F5F9", fontWeight: 700 }}>Live Notifications</h3>
                {unreadCount > 0 && (
                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "99px", background: "var(--critical)", color: "#fff", fontWeight: 800 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button className="ghost-button" type="button" onClick={markAllRead} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCheck size={13} /> Mark all read
              </button>
            </header>
            <div className="popover-list" style={{ maxHeight: "320px", overflowY: "auto" }}>
              {notifications.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--faint)", fontSize: "12px" }}>
                  <CheckCircle size={20} style={{ margin: "0 auto 8px", display: "block", color: "var(--success)" }} />
                  All clear — no active notifications
                </div>
              )}
              {notifications.map((item) => {
                const isWarning = item.severity === "warning" || item.severity === "medium";
                const isCritical = item.severity === "critical" || item.severity === "high";
                const iconColor = isCritical ? "#F87171" : isWarning ? "#FBBF24" : "#4ADE80";
                const Icon = isCritical ? AlertTriangle : isWarning ? AlertTriangle : Info;
                return (
                  <article
                    className={item.read ? "read" : ""}
                    key={item.id}
                    style={{
                      borderLeft: item.read ? "3px solid transparent" : `3px solid ${iconColor}`,
                      background: item.read ? "#0E1118" : "rgba(0,0,0,0.3)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <Icon size={14} style={{ color: iconColor, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: "12px", color: item.read ? "#94A3B8" : "#F1F5F9", display: "block", marginBottom: "2px" }}>{item.title}</strong>
                        <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0, lineHeight: 1.45 }}>{item.message}</p>
                      </div>
                    </div>
                    {item.read ? (
                      <StatusBadge value="acknowledged" />
                    ) : (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => acknowledgeNotification(item.id)}
                        style={{ fontSize: "10px", padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap" }}
                      >
                        Dismiss
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <button className="user-chip" type="button" onClick={() => setProfileOpen(!profileOpen)}>
          <span style={{ color: "#F1F5F9", fontWeight: 600, fontSize: "13px" }}>{user?.displayName ?? "ASRMS User"}</span>
          <span style={{ color: "#22D3EE", fontSize: "11px", fontFamily: "var(--font-data)" }}>{user?.email ?? ""}</span>
          <small>{user?.role === "super_admin" ? "SUPER ADMIN" : (user?.role ?? "viewer").toUpperCase()}</small>
        </button>
        {profileOpen && (
          <section className="popover profile-popover">
            <header>
              <h3>{profile?.displayName ?? user?.displayName}</h3>
              <StatusBadge value={user?.role === "super_admin" ? "super_admin" : (profile?.role ?? user?.role ?? "viewer")} />
            </header>
            <p><strong>Email:</strong> {profile?.email ?? user?.email}</p>
            <p><strong>Status:</strong> {profile?.status ?? "active"}</p>
            <p><strong>Last login:</strong> {profile?.lastLogin ?? "Current session"}</p>
            <p><strong>Access:</strong> {user?.role === "super_admin" ? "System Owner (Root privileges)" : user?.role === "admin" ? "Full platform control" : user?.role === "operator" ? "Monitoring and scaling operations" : user?.role === "developer" ? "Technical read-only visibility" : "Read-only visibility"}</p>
          </section>
        )}

        <button className="icon-button" title="Sign out" type="button" onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
