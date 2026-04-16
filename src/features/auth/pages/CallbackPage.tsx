"use client";

import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@kleffio/ui";

/**
 * Handles the OIDC redirect callback.
 * react-oidc-context processes the code exchange automatically when the
 * component mounts; we just wait for auth to settle, then forward the user.
 */
export function CallbackPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading) {
      // If the token exchange failed for any reason, go to login rather than
      // overview - sending an unauthenticated user to the protected route
      // causes an infinite signinRedirect loop.
      router.replace(auth.isAuthenticated ? "/overview" : "/auth/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return (
    <div className="w-48 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
