"use client";

import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { useAuth, broadcastSignout } from "@/features/auth";
import { AuthConfigContext } from "@/features/auth/context";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { PluginSlot } from "@/features/plugins/ui/PluginSlot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kleffio/ui";
import { Avatar, AvatarFallback } from "@kleffio/ui";

export function TopBar() {
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const { projects, currentProjectID, setCurrentProjectID } = useCurrentProject();
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    broadcastSignout();
    if (authConfig?.auth_mode === "redirect") {
      // Redirect mode: clear the IDP session via the end_session endpoint.
      auth.signoutRedirect();
    } else {
      // Headless mode: no IDP browser session exists, just clear locally.
      auth.removeUser();
      router.push("/auth/login");
    }
  }
  const user = auth.user;
  const displayName = user?.profile?.name ?? user?.profile?.email ?? "User";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  function handleProjectChange(projectID: string) {
    setCurrentProjectID(projectID);
    if (pathname === "/projects/new") return;
    if (pathname === "/projects" || pathname.startsWith("/projects/")) {
      router.push(`/projects/${projectID}`);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border px-5">
      <div className="flex min-w-0 items-center gap-2">
        {projects.length === 0 ? (
          <button
            type="button"
            disabled
            className="h-9 min-w-[200px] max-w-[280px] rounded-md border border-border bg-card px-3 text-left text-sm text-muted-foreground"
          >
            No projects
          </button>
        ) : (
          <Select value={currentProjectID ?? ""} onValueChange={handleProjectChange}>
            <SelectTrigger className="h-9 min-w-[200px] max-w-[280px] border-border bg-card text-foreground">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <PluginSlot name="topbar.right" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none">
              <span className="hidden max-w-[160px] truncate sm:block">{displayName}</span>
              <Avatar size="sm">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
