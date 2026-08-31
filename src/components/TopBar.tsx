"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, LogOut, Search, Shield, X } from "lucide-react";
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
            <header>
              <h3>Notifications</h3>
              <button className="ghost-button" type="button" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            </header>
            <div className="popover-list">
              {notifications.map((item) => (
                <article className={item.read ? "read" : ""} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </div>
                  {item.read ? (
                    <StatusBadge value="acknowledged" />
                  ) : (
                    <button className="ghost-button" type="button" onClick={() => acknowledgeNotification(item.id)}>
                      Ack
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <button className="user-chip" type="button" onClick={() => setProfileOpen(!profileOpen)}>
          <img src="/asrms-logo.png" alt="Admin" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          <span>{user?.displayName ?? "ASRMS User"}</span>
          <small>{user?.role === "super_admin" ? "Super Admin" : (user?.role ?? "viewer")}</small>
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
