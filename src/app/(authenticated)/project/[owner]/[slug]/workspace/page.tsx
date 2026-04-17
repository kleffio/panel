"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { ProjectArchitecturePage } from "@/features/projects/pages/ProjectArchitecturePage";

export default function ProjectWorkspacePage() {
  const { slug } = useParams<{ owner: string; slug: string }>();
  const { projects, setCurrentProjectID } = useCurrentProject();

  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (project) setCurrentProjectID(project.id);
  }, [project, setCurrentProjectID]);

  if (!project) return null;

  return <ProjectArchitecturePage projectID={project.id} />;
}
