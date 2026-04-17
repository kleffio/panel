"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Share2,
  ShieldCheck,
  Store,
  Puzzle,
  Search,
  Settings,
  LogOut,
  ChevronsUpDown,
  Check,
  Plus,
  ChevronDown,
  Network,
  Activity,
  Users,
} from "lucide-react";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Input,
  Button,
  Label,
} from "@kleffio/ui";
import { useAuth, broadcastSignout, useHasRole, useRoles, AuthConfigContext } from "@/features/auth";
import { PluginSlot } from "@/features/plugins/ui/PluginSlot";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { createProject } from "@/lib/api/projects";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  pathname: string;
}) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-sm font-medium transition-all",
        active
          ? "bg-primary/[0.1] text-primary"
          : "text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80"
      )}
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-md transition-all",
          active
            ? "bg-primary/[0.2] text-primary shadow-[0_0_10px_oklch(0.80_0.17_90_/_0.22)]"
            : "bg-white/[0.05] text-sidebar-foreground/40 group-hover:bg-white/[0.07] group-hover:text-sidebar-foreground/60"
        )}
      >
        <Icon className="size-3" />
      </span>
      {label}
    </Link>
  );
}

function NavSection({
  label,
  icon: Icon,
  children,
  isActive,
  defaultOpen = true,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(isActive ?? defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-sm font-medium transition-all",
          isActive
            ? "text-sidebar-foreground/90"
            : "text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80"
        )}
      >
        <span
          className={cn(
            "flex size-[22px] shrink-0 items-center justify-center rounded-md transition-all",
            isActive
              ? "bg-primary/[0.2] text-primary shadow-[0_0_10px_oklch(0.80_0.17_90_/_0.22)]"
              : "bg-white/[0.05] text-sidebar-foreground/40 group-hover:bg-white/[0.07] group-hover:text-sidebar-foreground/60"
          )}
        >
          <Icon className="size-3" />
        </span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-sidebar-foreground/25 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-[18px] mt-px mb-1 border-l border-sidebar-border/60 pl-3 space-y-px">
          {children}
        </div>
      )}
    </div>
  );
}

function NavChild({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-[6px] text-[13px] font-medium transition-all",
        active
          ? "bg-primary/[0.1] text-primary"
          : "text-sidebar-foreground/45 hover:bg-white/[0.04] hover:text-sidebar-foreground/70"
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded transition-all",
          active
            ? "text-primary"
            : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60"
        )}
      >
        <Icon className="size-3" />
      </span>
      {label}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const isAdmin = useHasRole("admin");
  const roles = useRoles();
  const { navItems: backendNavItems } = useBackendPlugins();
  const { projects, currentProjectID, setCurrentProjectID } = useCurrentProject();

  const [newProjectOpen, setNewProjectOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectLoading, setNewProjectLoading] = React.useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectID);
  const username =
    (auth.user?.profile?.preferred_username as string | undefined) ??
    (auth.user?.profile?.sub as string | undefined) ??
    "user";

  const projectBase = currentProject
    ? `/project/${username}/${currentProject.slug}`
    : null;

  const user = auth.user;
  const displayName = user?.profile?.name ?? user?.profile?.email ?? "User";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    setNewProjectLoading(true);
    try {
      const project = await createProject({ name, slug: slugify(name) });
      setNewProjectOpen(false);
      setNewProjectName("");
      window.location.assign(`/project/${username}/${project.slug}`);
    } finally {
      setNewProjectLoading(false);
    }
  }

  function handleSignOut() {
    broadcastSignout();
    if (authConfig?.auth_mode === "redirect") {
      auth.signoutRedirect();
    } else {
      auth.removeUser();
      router.push("/auth/login");
    }
  }

  return (
    <aside className="flex h-full w-56 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Project switcher */}
      <div className="px-2 pt-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.04] transition-colors focus-visible:outline-none">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25 shadow-[0_0_12px_oklch(0.80_0.17_90_/_0.15)]">
                <span className="text-sm font-black text-primary leading-none">K</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                  {currentProject?.name ??
                    (projects.length === 0 ? "No projects" : "Select project")}
                </p>
              </div>
              <ChevronsUpDown className="size-3.5 text-sidebar-foreground/25 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => {
                  setCurrentProjectID(project.id);
                  router.push(`/project/${username}/${project.slug}`);
                }}
                className="gap-2"
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    currentProjectID === project.id
                      ? "opacity-100 text-primary"
                      : "opacity-0"
                  )}
                />
                <span className="truncate">{project.name}</span>
              </DropdownMenuItem>
            ))}
            {projects.length === 0 && (
              <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                No projects
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => setNewProjectOpen(true)}>
              <Plus className="size-3.5 text-muted-foreground" />
              New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New project sheet */}
      <Sheet open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>New project</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateProject} className="flex flex-col gap-4 px-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="my-project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <SheetFooter className="px-0">
              <Button
                type="submit"
                disabled={!newProjectName.trim() || newProjectLoading}
                className="w-full"
              >
                {newProjectLoading ? "Creating…" : "Create project"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="px-2 pb-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-white/[0.03] px-2.5 py-1.5 text-xs text-sidebar-foreground/35 hover:bg-white/[0.05] hover:text-sidebar-foreground/55 transition-colors"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-sidebar-border bg-white/[0.04] px-1 py-0.5 text-[10px] font-mono text-sidebar-foreground/25">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-2 overflow-y-auto">
        {projectBase ? (
          <>
            <NavItem
              href={projectBase}
              label="Overview"
              icon={LayoutDashboard}
              exact
              pathname={pathname}
            />

            <NavSection
              label="Workspace"
              icon={Share2}
              isActive={pathname.startsWith(`${projectBase}/canvas`) || pathname.startsWith(`${projectBase}/monitoring`)}
            >
              <NavChild
                href={`${projectBase}/canvas`}
                label="Canvas"
                icon={Network}
                pathname={pathname}
              />
              <NavChild
                href={`${projectBase}/monitoring`}
                label="Monitoring"
                icon={Activity}
                pathname={pathname}
              />
            </NavSection>

            <NavItem
              href={`${projectBase}/plugins`}
              label="Plugins"
              icon={Store}
              pathname={pathname}
            />

            <NavItem
              href={`${projectBase}/settings`}
              label="Team"
              icon={Users}
              pathname={pathname}
            />
          </>
        ) : (
          <p className="px-2.5 py-2 text-xs text-sidebar-foreground/30">
            Select a project to get started.
          </p>
        )}

        <PluginSlot name="navbar.item" />

        {backendNavItems
          .filter((item) => !item.permission || roles.includes(item.permission))
          .map((item) => {
            const active =
              pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-sm font-medium transition-all",
                  active
                    ? "bg-primary/[0.1] text-primary"
                    : "text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80"
                )}
              >
                <span
                  className={cn(
                    "flex size-[22px] shrink-0 items-center justify-center rounded-md transition-all",
                    active
                      ? "bg-primary/[0.2] text-primary shadow-[0_0_10px_oklch(0.80_0.17_90_/_0.22)]"
                      : "bg-white/[0.05] text-sidebar-foreground/40 group-hover:bg-white/[0.07]"
                  )}
                >
                  <Puzzle className="size-3" />
                </span>
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User — pinned to bottom */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <PluginSlot name="topbar.right" />
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
            <DropdownMenuItem
              onClick={() =>
                projectBase ? router.push(projectBase) : router.push("/")
              }
            >
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
