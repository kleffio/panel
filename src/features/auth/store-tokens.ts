import { User } from "oidc-client-ts";
import type { IdTokenClaims } from "oidc-client-ts";
import type { ApiTokenResponse } from "./models";

export type { ApiTokenResponse };

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

/**
 * Persists an API token response into the sessionStorage slot that
 * oidc-client-ts reads on startup: `oidc.user:{authority}:{client_id}`.
 *
 * Pass the authority and client_id from the fetched AuthConfig so the key
 * matches what the OidcProvider will look up on the next hard navigation.
 */
export function storeApiTokens(
  tok: ApiTokenResponse,
  authority: string,
  clientId: string,
): void {
  const rawProfile = decodeJwtPayload(tok.id_token ?? tok.access_token);
  const profile = {
    sub: (rawProfile.sub as string) ?? "",
    ...rawProfile,
  } as IdTokenClaims;

  const user = new User({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    id_token: tok.id_token,
    token_type: tok.token_type ?? "Bearer",
    expires_at: tok.expires_in
      ? Math.floor(Date.now() / 1000) + tok.expires_in
      : undefined,
    scope: tok.scope,
    profile,
  });

  // Use localStorage so the session is shared across tabs.
  // OidcProvider is configured with the same store for headless mode.
  const key = `oidc.user:${authority}:${clientId}`;
  localStorage.setItem(key, user.toStorageString());
}
