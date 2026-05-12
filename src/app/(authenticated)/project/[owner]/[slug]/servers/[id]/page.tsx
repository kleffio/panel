"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { ServerInstancePage } from "@/features/hosting/pages/ServerInstancePage";

export default function ServerPage() {
  const { owner, slug, id } = useParams<{
    owner: string;
    slug: string;
    id: string;
  }>();
  const { projects, setCurrentProjectID } = useCurrentProject();
  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (project) setCurrentProjectID(project.id);
  }, [project, setCurrentProjectID]);

  if (!project) return null;

  return (
    <ServerInstancePage
      projectID={project.id}
      owner={owner}
      slug={slug}
      workloadID={id}
    />
  );
}
