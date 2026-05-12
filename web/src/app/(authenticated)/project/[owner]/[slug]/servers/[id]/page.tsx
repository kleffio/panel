"use client";

import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { ServerOverviewPage } from "@/features/hosting/pages/ServerOverviewPage";

export default function ServerPage() {
  const { slug, id } = useParams<{ owner: string; slug: string; id: string }>();
  const { projects } = useCurrentProject();
  const project = projects.find((p) => p.slug === slug);

  if (!project) return null;

  return <ServerOverviewPage projectID={project.id} workloadID={id} />;
}
