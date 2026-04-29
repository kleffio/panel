"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { Settings, ShieldCheck, LogOut, ChevronsUpDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from "@kleffio/ui";
import { useAuth, broadcastSignout, useHasRole, AuthConfigContext } from "@/features/auth";
import { useUnreadCount, useNotificationStream } from "@/features/notifications";
import { revokeSession } from "@/lib/api/plugins";

export function SidebarUserFooter({ workspaceHref = "/" }: { workspaceHref?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const isAdmin = useHasRole("admin");

  useNotificationStream();
  const { data: unreadCount = 0 } = useUnreadCount();
  const hasUnread = unreadCount > 0;
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const user = auth.user;
  const displayName = user?.profile?.name ?? user?.profile?.email ?? "User";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    if (authConfig?.auth_mode === "redirect") {
      broadcastSignout();
      auth.signoutRedirect();
    } else {
      const sid = auth.user?.profile?.sid as string | undefined;
      if (sid) {
        try {
          await revokeSession(sid);
        } catch {
          // best-effort — still clear local session
        }
      }
      broadcastSignout();
      auth.removeUser();
      router.push("/auth/login");
    }
  }

  return (
    <div className="border-t border-sidebar-border px-2 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-white/[0.05] focus-visible:outline-none">
            <div className="relative shrink-0">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold ring-1 ring-primary/20">
                  {initial}
                </AvatarFallback>
              </Avatar>
              {hasUnread && (
                <span className="absolute -top-1 -left-1 z-10 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white leading-none border border-sidebar shadow-sm">
                  {unreadLabel}
                </span>
              )}
            </div>
            <span className="flex-1 truncate text-left text-xs font-medium text-sidebar-foreground/60">
              {displayName}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/25" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48 mb-1">
          <DropdownMenuItem onClick={() => router.push(workspaceHref)}>
            <LayoutGrid className="size-4" />
            Workspace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/account")}>
            <Settings className="size-4" />
            <span className="flex-1">Account</span>
            {hasUnread && (
              <span className="flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
                {unreadLabel}
              </span>
            )}
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
  );
}
