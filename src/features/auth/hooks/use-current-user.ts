"use client";

import { useContext } from "react";
import { CurrentUserContext, type CurrentUser } from "../context";

/** Returns the authenticated user (id + roles), or null if not yet loaded. */
export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}

/** Returns the current user's role list. Empty array while loading. */
export function useRoles(): string[] {
  return useCurrentUser()?.roles ?? [];
}

/**
 * Returns true if the current user has the given role.
 * Role membership is determined server-side by the Go API (IDP-agnostic).
 */
export function useHasRole(role: string): boolean {
  return useCurrentUser()?.roles.includes(role) ?? false;
}
