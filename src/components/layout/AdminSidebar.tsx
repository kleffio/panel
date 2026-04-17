"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Puzzle, Users, ScrollText } from "lucide-react";
import { cn } from "@kleffio/ui";

const ADMIN_NAV = [
  { href: "/admin",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/plugins", label: "Plugins",    icon: Puzzle },
  { href: "/admin/members", label: "Members",    icon: Users },
  { href: "/admin/audit",   label: "Audit Log",  icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-full w-56 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Back + label */}
      <div className="px-3 pt-4 pb-3 border-b border-sidebar-border">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3.5" />
          Back to workspace
        </button>
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex size-6 items-center justify-center rounded-md bg-destructive/15">
            <span className="text-[10px] font-black text-destructive leading-none">A</span>
          </div>
          <span className="text-xs font-semibold text-sidebar-foreground">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-destructive" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
