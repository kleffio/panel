"use client";

import { useAuth } from "@/features/auth";

export function TopBar() {
  const auth = useAuth();
  const user = auth.user;
  const displayName = user?.profile?.name ?? user?.profile?.email ?? "User";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-5">
      {/* Breadcrumb / page title injected via page metadata — empty for now */}
      <div />

      {/* User identity */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="max-w-[180px] truncate">{displayName}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {displayName[0]?.toUpperCase() ?? "U"}
        </span>
      </div>
    </header>
  );
}
