"use client";

import { use } from "react";
import { ProjectArchitecturePage } from "@/features/projects/pages/ProjectArchitecturePage";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);

  return <ProjectArchitecturePage projectID={id} />;
}
