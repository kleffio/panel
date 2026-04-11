import { ProjectsDashboard } from "@/features/projects/ui/ProjectsDashboard";
import type { ProjectsDashboardPageData } from "@/types/projects";

export function ProjectsView({ projects }: ProjectsDashboardPageData) {
  return <ProjectsDashboard projects={projects} />;
}
