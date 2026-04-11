import "server-only";

import { simulateRequest } from "@/lib/mock/request";
import type { ProjectsDashboardPageData } from "@/types/projects";

const fixture: ProjectsDashboardPageData = {
  projects: [
    {
      id: "proj-1",
      name: "gravy-truck",
      status: "healthy",
      region: "us-east",
      servicesCount: 4,
      aiSummary: "Everything is running smoothly. Traffic is stable across all edges.",
      href: "/architecture",
    },
    {
      id: "proj-2",
      name: "platform-api",
      status: "warning",
      region: "eu-west",
      servicesCount: 2,
      aiSummary: "2 services need attention. CPU load is trending high.",
      href: "/overview",
    },
    {
      id: "proj-3",
      name: "marketing-site",
      status: "healthy",
      region: "us-east",
      servicesCount: 1,
      aiSummary: "Optimal performance caching at the edge.",
      href: "/hosting/web",
    },
  ],
};

export async function getProjectsDashboardPageData(): Promise<ProjectsDashboardPageData> {
  return simulateRequest(fixture);
}
