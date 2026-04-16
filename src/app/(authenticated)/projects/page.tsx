"use client";

import * as React from "react";
import { listProjects, listWorkloads } from "@/lib/api";
import type { ProjectsDashboardPageData } from "@/types/projects";
import { ProjectsDashboard } from "@/features/projects/ui/ProjectsDashboard";

export default function ProjectsPage() {
  const [data, setData] = React.useState<ProjectsDashboardPageData>({ projects: [] });

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const projectResponse = await listProjects();
      const cards = await Promise.all(
        (projectResponse.projects ?? []).map(async (project) => {
          const workloadsResponse = await listWorkloads(project.id).catch(() => ({ workloads: [] }));
          const workloads = workloadsResponse.workloads ?? [];
          const failed = workloads.some((workload) => workload.state === "failed");
          const warning = workloads.some((workload) => workload.state === "pending" || workload.state === "stopped");
          const status: "error" | "warning" | "healthy" = failed
            ? "error"
            : warning
              ? "warning"
              : "healthy";
          return {
            id: project.id,
            name: project.name,
            status,
            region: "local",
            servicesCount: workloads.length,
            aiSummary:
              status === "error"
                ? "One or more workloads are failing."
                : status === "warning"
                ? "Provisioning is in progress or workloads are stopped."
                : "Project workloads are healthy.",
            href: `/projects/${project.id}`,
          };
        }),
      );
      if (!cancelled) {
        setData({ projects: cards });
      }
    };
    load().catch(() => {
      if (!cancelled) {
        setData({ projects: [] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ProjectsDashboard projects={data.projects} />;
}
