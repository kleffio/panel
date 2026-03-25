export const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? "",
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "panel",
  // In Next.js App Router, window is not available at module init time.
  // redirect_uri is evaluated lazily by react-oidc-context on the client.
  redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
  post_logout_redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/` : "",
  // Auto-renew access tokens using the refresh token before they expire.
  automaticSilentRenew: true,
  useRefreshTokens: true,
  onSigninCallback: () => {
    // Replace the URL so the auth code/state params don't linger.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
} as const;
