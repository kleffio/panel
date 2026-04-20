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
 *
 * Must mirror AuthProvider's condition for mounting OidcProvider exactly —
 * both require enabled + authority + client_id to be truthy. If they diverge,
 * useOidcAuth() gets called without an OidcProvider in the tree and crashes.
 */
export function useAuth(): AuthContextProps {
  const config = useContext(AuthConfigContext);
  // Only call useOidcAuth when OidcProvider is actually in the tree.
  if (!config?.enabled || !config?.authority || !config?.client_id) return DISABLED_AUTH;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useOidcAuth();
}
