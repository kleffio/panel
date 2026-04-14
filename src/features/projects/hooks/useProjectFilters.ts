"use client";

import { useState } from "react";
import type { ProjectsDashboardPageData } from "@/types/projects";

type Project = ProjectsDashboardPageData["projects"][number];

export function useProjectFilters(projects: Project[]) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return { search, setSearch, filter, setFilter, filteredProjects };
}
