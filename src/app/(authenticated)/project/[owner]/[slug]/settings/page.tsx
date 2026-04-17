"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { ProjectSettingsPage } from "@/features/projects/pages/ProjectSettingsPage";

export default function ProjectSettingsRoute() {
  const { slug } = useParams<{ owner: string; slug: string }>();
  const { projects, setCurrentProjectID } = useCurrentProject();

  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (project) setCurrentProjectID(project.id);
  }, [project, setCurrentProjectID]);

  if (!project) return null;

  return <ProjectSettingsPage orgID={project.organization_id} />;
}
