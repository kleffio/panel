"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, router]);

  if (auth.isLoading) {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Panel
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your game servers</p>
        </div>

        <Button className="w-full" onClick={() => auth.signinRedirect()}>
          Sign in
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={() => auth.signinRedirect({ extraQueryParams: { prompt: "registration" } })}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
