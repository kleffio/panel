"use client";

import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";

export function useServerContext() {
  const { slug, id } = useParams<{ owner: string; slug: string; id: string }>();
  const { projects } = useCurrentProject();
  const project = projects.find((p) => p.slug === slug);
  return { projectID: project?.id ?? "", workloadID: id };
}
