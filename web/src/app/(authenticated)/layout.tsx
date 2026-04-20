"use client";

import { useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth, AuthConfigContext } from "@/features/auth";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PluginContextProvider } from "@/features/plugins/ui/PluginContextProvider";
import { CurrentProjectProvider } from "@/features/projects/model/CurrentProjectProvider";
import { Skeleton } from "@kleffio/ui";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !redirecting) {
      setRedirecting(true);
      if (authConfig?.setup_required) {
        router.replace("/setup");
      } else if (authConfig?.auth_mode === "redirect") {
        auth.signinRedirect();
      } else {
        router.replace("/auth/login");
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, authConfig?.auth_mode, authConfig?.setup_required, redirecting]);

  if (auth.isLoading || redirecting || !auth.isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return (
    <PluginContextProvider>
      <CurrentProjectProvider>
        <AppShell>{children}</AppShell>
      </CurrentProjectProvider>
    </PluginContextProvider>
  );
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
