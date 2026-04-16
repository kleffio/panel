"use client";

import * as React from "react";
import { listProjects, type ProjectDTO } from "@/lib/api";

type CurrentProjectContextValue = {
  projects: ProjectDTO[];
  currentProjectID: string | null;
  setCurrentProjectID: (projectID: string) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
};

const CurrentProjectContext = React.createContext<CurrentProjectContextValue | null>(
  null
);

const storageKey = "kleff.currentProjectID";

export function CurrentProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<ProjectDTO[]>([]);
  const [currentProjectID, setCurrentProjectIDState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const setCurrentProjectID = React.useCallback((projectID: string) => {
    setCurrentProjectIDState(projectID);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, projectID);
    }
  }, []);

  const refreshProjects = React.useCallback(async () => {
    const response = await listProjects();
    const loaded = response.projects ?? [];
    setProjects(loaded);

    const persisted =
      typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const exists = persisted && loaded.some((project) => project.id === persisted);

    if (exists && persisted) {
      setCurrentProjectIDState(persisted);
      return;
    }
    if (loaded.length > 0) {
      const nextID = loaded[0].id;
      setCurrentProjectIDState(nextID);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, nextID);
      }
      return;
    }
    setCurrentProjectIDState(null);
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
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshProjects]);

  return (
    <CurrentProjectContext.Provider
      value={{ projects, currentProjectID, setCurrentProjectID, refreshProjects, isLoading }}
    >
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  const ctx = React.useContext(CurrentProjectContext);
  if (!ctx) {
    throw new Error("useCurrentProject must be used within CurrentProjectProvider");
  }
  return ctx;
}
