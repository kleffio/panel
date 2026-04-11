"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  FolderKanban,
  Shield,
  Server,
  CreditCard,
  Settings,
  ShieldCheck,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasRole, useRoles } from "@/features/auth";
import { PluginSlot } from "@/components/plugin/PluginSlot";
import { useBackendPlugins } from "@/lib/plugins/use-backend-plugins";
import { Puzzle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/overview",     label: "Overview",     icon: Network },
  { href: "/projects",     label: "Projects",     icon: FolderKanban },
  { href: "/architecture", label: "Architecture", icon: Shield },
  { href: "/servers",      label: "Servers",      icon: Server },
  { href: "/marketplace",  label: "Marketplace",  icon: Store },
  { href: "/billing",      label: "Billing",      icon: CreditCard },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = useHasRole("admin");
  const roles = useRoles();
  const { navItems: backendNavItems } = useBackendPlugins();

  const items = isAdmin
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center px-5 border-b border-sidebar-border">
        <span className="text-gradient-kleff text-lg font-bold tracking-tight">Kleff</span>
        <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        <PluginSlot name="navbar.item" />

        {/* Backend-driven nav items from gRPC plugin UI manifests */}
        {backendNavItems
          .filter((item) => !item.permission || roles.includes(item.permission))
          .map((item) => {
            const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Puzzle className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
      </nav>

    </aside>
  );
}
