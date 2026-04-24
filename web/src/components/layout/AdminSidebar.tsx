"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Puzzle, Users, ScrollText, Settings, ShieldCheck, LogOut, ChevronsUpDown, LayoutGrid } from "lucide-react";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from "@kleffio/ui";
import { useAuth, broadcastSignout, useHasRole, AuthConfigContext } from "@/features/auth";
import { revokeAllSessions } from "@/lib/api/plugins";

const ADMIN_NAV = [
  { href: "/admin",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/plugins", label: "Plugins",    icon: Puzzle },
  { href: "/admin/members", label: "Members",    icon: Users },
  { href: "/admin/audit",   label: "Audit Log",  icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const isAdmin = useHasRole("admin");

  const user = auth.user;
  const displayName = user?.profile?.name ?? user?.profile?.email ?? "User";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  function handleSignOut() {
    broadcastSignout();
    if (authConfig?.auth_mode === "redirect" && authConfig?.end_session_endpoint) {
      auth.signoutRedirect();
    } else {
      revokeAllSessions().catch(() => {});
      auth.removeUser();
      router.push("/auth/login");
    }
  }

  return (
    <aside className="flex h-full w-56 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Section label */}
      <div className="px-2 pt-3 pb-2">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/15 ring-1 ring-destructive/20">
            <span className="text-sm font-black text-destructive leading-none">A</span>
          </div>
          <span className="text-xs font-semibold text-sidebar-foreground">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-px px-2 py-1 overflow-y-auto">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/[0.07] text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80"
              )}
            >
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md transition-all",
                active
                  ? "bg-destructive/20 text-destructive shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "bg-white/[0.04] text-sidebar-foreground/40"
              )}>
                <Icon className="size-3.5" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User — pinned to bottom */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-white/[0.05] focus-visible:outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold ring-1 ring-primary/20">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-left text-xs font-medium text-sidebar-foreground/60">
                {displayName}
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/25" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 mb-1">
            <DropdownMenuItem onClick={() => router.push("/")}>
              <LayoutGrid className="size-4" />
              Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/account")}>
              <Settings className="size-4" />
              Account
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <ShieldCheck className="size-4" />
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
