"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AdminShell } from "./AdminShell";
import { PersonalHubShell } from "./PersonalHubShell";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <AdminShell>{children}</AdminShell>;
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/settings")) {
    return <PersonalHubShell>{children}</PersonalHubShell>;
  }

  const isFullBleed = pathname.endsWith("/canvas");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className={isFullBleed ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto px-6 py-6"}>
        {children}
      </main>
    </div>
  );
}
