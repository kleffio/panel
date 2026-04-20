"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { listProjects, type ProjectDTO } from "@/lib/api";

type CurrentProjectContextValue = {
  projects: ProjectDTO[];
  currentProjectID: string | null;
  setCurrentProjectID: (projectID: string) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
};

const CurrentProjectContext = React.createContext<CurrentProjectContextValue | null>(null);

const storageKey = "kleff.currentProjectSlug";

// Paths that are not project-scoped and should not trigger auto-navigation.
const NO_NAV_PREFIXES = ["/project/", "/admin", "/account", "/settings", "/auth", "/notifications"];

export function CurrentProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<ProjectDTO[]>([]);
  const [currentProjectID, setCurrentProjectIDState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  const username = (auth.user?.profile?.preferred_username as string | undefined)
    ?? (auth.user?.profile?.sub as string | undefined)
    ?? "user";

  const setCurrentProjectID = React.useCallback((projectID: string) => {
    setCurrentProjectIDState(projectID);
  }, []);

  const refreshProjects = React.useCallback(async () => {
    const response = await listProjects();
    const loaded = response.projects ?? [];
    setProjects(loaded);

    const persistedSlug = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const persisted = persistedSlug ? loaded.find((p) => p.slug === persistedSlug) : null;

    if (persisted) {
      setCurrentProjectIDState(persisted.id);
      return;
    }
    const defaultProject = loaded.find((p) => p.is_default) ?? loaded[0];
    if (defaultProject) {
      setCurrentProjectIDState(defaultProject.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, defaultProject.slug);
      }
    } else {
      setCurrentProjectIDState(null);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    refreshProjects()
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
          setCurrentProjectIDState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshProjects]);

  // Auto-navigate to the default project when landing on a bare/root path.
  React.useEffect(() => {
    if (isLoading || projects.length === 0) return;
    const isProjectScoped = NO_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isProjectScoped) {
      const proj = projects.find((p) => p.is_default) ?? projects[0];
      router.replace(`/project/${username}/${proj.slug}`);
    }
  }, [isLoading, projects, pathname, username, router]);

  // Persist slug when currentProjectID changes.
  React.useEffect(() => {
    if (!currentProjectID) return;
    const proj = projects.find((p) => p.id === currentProjectID);
    if (proj && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, proj.slug);
    }
  }, [currentProjectID, projects]);

  return (
    <CurrentProjectContext.Provider value={{ projects, currentProjectID, setCurrentProjectID, refreshProjects, isLoading }}>
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  const ctx = React.useContext(CurrentProjectContext);
  if (!ctx) throw new Error("useCurrentProject must be used within CurrentProjectProvider");
  return ctx;
}
