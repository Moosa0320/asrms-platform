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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, area: "dashboard" },
  { href: "/monitoring", label: "Monitoring", icon: Activity, area: "monitoring" },
  { href: "/scaling", label: "Auto-Scaling", icon: Gauge, area: "scaling" },
  { href: "/policies", label: "Policies", icon: SlidersHorizontal, area: "policies" },
  { href: "/predictive", label: "Predictive", icon: BrainCircuit, area: "predictive" },
  { href: "/alerts", label: "Alerts", icon: Bell, area: "alerts" },
  { href: "/cloud-providers", label: "Providers", icon: Cloud, area: "providers" },
  { href: "/resources", label: "Resources", icon: Server, area: "resources" },
  { href: "/cost", label: "Cost", icon: DollarSign, area: "cost" },
  { href: "/audit", label: "Audit", icon: FileClock, area: "audit" },
  { href: "/users", label: "Users", icon: Users, area: "users" },
  { href: "/settings", label: "Settings", icon: Settings, area: "settings" },
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
        {navItems
          .filter((item) => canAccess(item.area))
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={pathname === item.href ? "active" : ""}
                href={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
