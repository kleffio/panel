import type { Metadata } from "next";
import { getProjectsDashboardPageData } from "@/features/projects/server/loaders";
import { ProjectsView } from "./ProjectsView";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const data = await getProjectsDashboardPageData();
  return <ProjectsView projects={data.projects} />;
}
