"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, UserCircle, ShieldCheck, MonitorSmartphone } from "lucide-react";
import { cn } from "@kleffio/ui";
import { useAuth } from "@/features/auth";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";

const ACCOUNT_NAV = [
  { href: "/account",           label: "Profile",  icon: UserCircle },
  { href: "/account/security",  label: "Security", icon: ShieldCheck },
  { href: "/account/sessions",  label: "Sessions", icon: MonitorSmartphone },
];

export function PersonalHubSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { projects, currentProjectID } = useCurrentProject();

  const username = (auth.user?.profile?.preferred_username as string | undefined)
    ?? (auth.user?.profile?.sub as string | undefined)
    ?? "user";
  const currentProject = projects.find((p) => p.id === currentProjectID);
  const backHref = currentProject
    ? `/project/${username}/${currentProject.slug}`
    : "/";

  return (
    <aside className="flex h-full w-56 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Back + label */}
      <div className="px-3 pt-4 pb-3 border-b border-sidebar-border">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3.5" />
          Back to workspace
        </button>
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/15">
            <span className="text-[10px] font-black text-primary leading-none">A</span>
          </div>
          <span className="text-xs font-semibold text-sidebar-foreground">Account</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/account"
            ? pathname === "/account"
            : pathname === href || pathname.startsWith(`${href}/`);
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
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
