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

/** GET /api/v1/auth/me — returns the current user's ID and roles from the JWT. */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await apiClient.get<{ data: { user_id: string; email: string; roles: string[] } }>(
    "/api/v1/auth/me"
  );
  return { userId: res.data.data.user_id, email: res.data.data.email, roles: res.data.data.roles ?? [] };
}

export interface AuthConfig {
  enabled: boolean;
  /** True when no IDP plugin is installed — the user must complete initial setup. */
  setup_required?: boolean;
  /** True once the IDP plugin has finished starting up and is ready to serve auth requests. */
  ready?: boolean;
  authority?: string;
  client_id?: string;
  jwks_uri?: string;
  scopes?: string[];
  /** "headless" = Kleff login form (default). "redirect" = OIDC Authorization Code flow via IDP. */
  auth_mode?: "headless" | "redirect";
}

/**
 * GET /api/v1/auth/config — returns OIDC settings from the active IDP plugin.
 * Call this on app load to bootstrap the OIDC client dynamically instead of
 * relying on build-time NEXT_PUBLIC_* env vars.
 */
export async function fetchAuthConfig(): Promise<AuthConfig> {
  const res = await fetch("/api/v1/auth/config");
  const data = await res.json().catch(() => ({}));
  return (data.data ?? { enabled: false }) as AuthConfig;
}
