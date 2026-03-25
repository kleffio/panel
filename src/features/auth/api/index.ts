import { apiClient } from "@/lib/api";
import type { ApiTokenResponse, CurrentUser } from "../models";

/** POST /api/v1/auth/login — headless mode only. */
export async function login(username: string, password: string): Promise<ApiTokenResponse> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Login failed. Please try again.");
  return data.data as ApiTokenResponse;
}

/** POST /api/v1/auth/register — headless mode only. */
export async function register(params: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ user_id: string }> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Registration failed. Please try again.");
  return data.data as { user_id: string };
}

/**
 * GET /api/v1/identity/me — fetches the current user's ID and roles.
 * Roles are resolved server-side from token introspection, so this works
 * identically regardless of which identity provider is configured.
 */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await apiClient.get<{ data: { user_id: string; roles: string[] } }>(
    "/api/v1/identity/me"
  );
  return { userId: res.data.data.user_id, roles: res.data.data.roles ?? [] };
}
