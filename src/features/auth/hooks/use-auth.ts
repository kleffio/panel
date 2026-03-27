"use client";

import { useContext } from "react";
import { useAuth as useOidcAuth, type AuthContextProps } from "react-oidc-context";
import { AuthConfigContext } from "../context";

// Returned when no IDP is configured (no OidcProvider in the tree).
const DISABLED_AUTH = {
  isAuthenticated: false,
  isLoading: false,
  signinRedirect: () => Promise.resolve(),
  signoutRedirect: () => Promise.resolve(),
  user: null,
  error: undefined,
  activeNavigator: undefined,
  isLoadingSigninSilent: false,
  isLoadingCheckSession: false,
} as unknown as AuthContextProps;

/**
 * Safe wrapper around react-oidc-context's useAuth.
 * Returns a no-op stub when the IDP plugin is not configured, so pages
 * don't need to guard against the OidcProvider being absent.
 */
export function useAuth(): AuthContextProps {
  const config = useContext(AuthConfigContext);
  // If auth is disabled (no OidcProvider in tree), return the stub.
  if (!config?.enabled) return DISABLED_AUTH;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useOidcAuth();
}
