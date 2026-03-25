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
 * After calling this, do a hard navigation (window.location.replace) so that
 * the OidcProvider initialises fresh and loads the user from storage.
 */
export function storeApiTokens(tok: ApiTokenResponse): void {
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

  const key = `oidc.user:${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}:${process.env.NEXT_PUBLIC_OIDC_CLIENT_ID}`;
  sessionStorage.setItem(key, user.toStorageString());
}
