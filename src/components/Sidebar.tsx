"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BrainCircuit,
  Cloud,
  DollarSign,
  FileClock,
  Gauge,
  LayoutDashboard,
  Server,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "./Logo";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, area: "dashboard" },
      { href: "/monitoring", label: "Monitoring", icon: Activity, area: "monitoring" },
    ],
  },
  {
    label: "Scaling & Policies",
    items: [
      { href: "/scaling", label: "Auto-Scaling", icon: Gauge, area: "scaling" },
      { href: "/policies", label: "Policies", icon: SlidersHorizontal, area: "policies" },
      { href: "/predictive", label: "Predictive", icon: BrainCircuit, area: "predictive" },
    ],
  },
  {
    label: "Observability",
    items: [
      { href: "/alerts", label: "Alerts", icon: Bell, area: "alerts" },
      { href: "/resources", label: "Resources", icon: Server, area: "resources" },
      { href: "/cost", label: "Cost", icon: DollarSign, area: "cost" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/cloud-providers", label: "Providers", icon: Cloud, area: "providers" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/audit", label: "Audit", icon: FileClock, area: "audit" },
      { href: "/users", label: "Users", icon: Users, area: "users" },
      { href: "/settings", label: "Settings", icon: Settings, area: "settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { canAccess } = useAuth();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <Logo />
      </Link>
      <nav>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item.area));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="nav-group">
              <span className="nav-group__label">{group.label}</span>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    className={isActive ? "active" : ""}
                    href={item.href}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
