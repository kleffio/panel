export const authDisabled =
  process.env.NEXT_PUBLIC_AUTH_DISABLED?.toLowerCase() === "true";

// TODO: REMOVE CODE ABOVE THIS LINE AFTER AUTH IS READY

export const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? "",
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "panel",
  // In Next.js App Router, window is not available at module init time.
  // redirect_uri is evaluated lazily by react-oidc-context on the client.
  redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
  post_logout_redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/` : "",
  onSigninCallback: () => {
    // Replace the URL so the auth code/state params don't linger.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
} as const;
