"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";

export default function NewProjectPage() {
  const router = useRouter();
  const { refreshProjects } = useCurrentProject();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const project = await createProject({ name, slug: slug || undefined });
      await refreshProjects();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new project scope for workload isolation.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Project name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="My game stack"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Slug (optional)</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="my-game-stack"
          />
        </label>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
