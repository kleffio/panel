"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, Sparkles, Server, Globe, Settings } from "lucide-react";
import type { ProjectsDashboardPageData } from "@/types/projects";

export function ProjectsDashboard({ projects }: ProjectsDashboardPageData) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500 text-zinc-50">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-zinc-400">View and manage your deployed applications.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:opacity-90">
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search projects by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-zinc-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-zinc-700 cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <div key={project.id} className="relative group">
            <Link 
              href={project.href}
              className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/10"
            >
              <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg text-zinc-50 group-hover:text-amber-400 transition-colors">{project.name}</h3>
              <div className="flex h-6 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-800/50 px-2.5 text-xs font-medium">
                <span className={`h-2 w-2 rounded-full ${project.status === 'healthy' ? 'bg-emerald-500' : project.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="capitalize text-zinc-50">{project.status}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-start gap-3 rounded-xl bg-zinc-800/50 p-4">
              <Sparkles className={`mt-0.5 h-4 w-4 shrink-0 ${project.status === 'healthy' ? 'text-emerald-500' : project.status === 'warning' ? 'text-amber-500' : 'text-rose-500'}`} />
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                {project.aiSummary}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-medium text-zinc-400 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span className="uppercase">{project.region}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                {project.servicesCount} Active Services
              </div>
            </div>
            </Link>
            <Link
              href="/admin"
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Manage Project Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-400 rounded-xl border border-dashed border-zinc-800">
            No projects found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
