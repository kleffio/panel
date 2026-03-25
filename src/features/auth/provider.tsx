"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { setApiAccessToken, clearApiAccessToken } from "@/lib/api";
import { oidcConfig } from "./config";
import { CurrentUserContext, type CurrentUser } from "./context";
import { fetchCurrentUser } from "./api";

/**
 * Syncs the OIDC session with:
 *   1. The in-memory bearer token used by apiClient.
 *   2. The CurrentUserContext (userId + roles from GET /api/v1/identity/me).
 *
 * Roles are fetched server-side so the frontend has no IDP-specific logic.
 */
function CurrentUserProvider({ children }: { children: ReactNode }) {
  const auth = useOidcAuth();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      setApiAccessToken(auth.user.access_token);
      fetchCurrentUser()
        .then(setCurrentUser)
        .catch(() => {
          // Fallback: user is authenticated but /me failed — grant no roles.
          setCurrentUser({ userId: auth.user?.profile?.sub ?? "", roles: [] });
        });
    } else {
      clearApiAccessToken();
      setCurrentUser(null);
    }
  }, [auth.isAuthenticated, auth.user?.access_token]);

  return (
    <CurrentUserContext.Provider value={currentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider {...oidcConfig}>
      <CurrentUserProvider>{children}</CurrentUserProvider>
    </OidcProvider>
  );
}
