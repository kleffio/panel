"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { UserDashboard } from "@/features/dashboard/pages/UserDashboard";

export default function ProjectOverviewPage() {
  const { slug } = useParams<{ owner: string; slug: string }>();
  const { projects, setCurrentProjectID } = useCurrentProject();

  useEffect(() => {
    const project = projects.find((p) => p.slug === slug);
    if (project) setCurrentProjectID(project.id);
  }, [slug, projects, setCurrentProjectID]);

  return <UserDashboard />;
}
