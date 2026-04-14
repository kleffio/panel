import type { Metadata } from "next";
import { getProjectsDashboardPageData } from "@/features/projects/server/loaders";
import { ProjectsDashboard } from "@/features/projects/pages/ProjectsDashboard";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const data = await getProjectsDashboardPageData();
  return <ProjectsDashboard projects={data.projects} />;
}
