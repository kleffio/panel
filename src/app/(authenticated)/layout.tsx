"use client";

import { useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth, AuthConfigContext } from "@/features/auth";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !redirecting) {
      setRedirecting(true);
      if (authConfig?.auth_mode === "redirect") {
        auth.signinRedirect();
      } else {
        router.replace("/auth/login");
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, authConfig?.auth_mode, redirecting]);

  if (auth.isLoading || redirecting || !auth.isAuthenticated) {
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
