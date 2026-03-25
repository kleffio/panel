"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.error && !auth.isAuthenticated && !redirecting) {
      setRedirecting(true);
      router.replace("/auth/login");
    }
  }, [auth, redirecting]);

  if (auth.isLoading || redirecting) {
    return <AuthLoadingScreen />;
  }

  if (auth.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-red-400">Authentication error</p>
          <p className="text-xs text-zinc-500">{auth.error.message}</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <AppShell>{children}</AppShell>;
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-48 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
