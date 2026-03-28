"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { setApiAccessToken, clearApiAccessToken } from "@/lib/api";
import { oidcConfig } from "./config";

// Keeps the in-memory bearer token in sync with OIDC session state.
function AuthTokenSync() {
  const auth = useOidcAuth();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      setApiAccessToken(auth.user.access_token);
    } else {
      clearApiAccessToken();
    }
  }, [auth.isAuthenticated, auth.user?.access_token]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider {...oidcConfig}>
      <AuthTokenSync />
      {children}
    </OidcProvider>
  );
}
