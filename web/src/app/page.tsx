"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { listProjects } from "@/lib/api";

export default function RootPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    const username = (auth.user?.profile?.preferred_username as string | undefined)
      ?? (auth.user?.profile?.sub as string | undefined)
      ?? "user";

    listProjects()
      .then((res) => {
        const projects = res.projects ?? [];
        const proj = projects.find((p) => p.is_default) ?? projects[0];
        if (proj) {
          router.replace(`/project/${username}/${proj.slug}`);
        } else {
          router.replace("/auth/login");
        }
      })
      .catch(() => router.replace("/auth/login"));
  }, [auth.isLoading, auth.isAuthenticated, auth.user, router]);

  return null;
}
