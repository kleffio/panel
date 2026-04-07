"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { setApiAccessToken, clearApiAccessToken } from "@/lib/api";
import { CurrentUserContext, AuthConfigContext, type CurrentUser } from "./context";
import { fetchCurrentUser, fetchAuthConfig, type AuthConfig } from "./api";

// Non-OIDC fields that are always the same regardless of IDP.
const oidcStaticConfig = {
  // redirect_uri is required by oidc-client-ts even in headless mode.
  redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
  // post_logout_redirect_uri tells Keycloak where to send the user after logout.
  // When id_token_hint is present (which oidc-client-ts sends automatically),
  // Keycloak skips its own "You are logged out" page and redirects silently.
  post_logout_redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/login` : "",
  automaticSilentRenew: true,
  useRefreshTokens: true,
} as const;

// Channel name used to broadcast sign-out across tabs.
const AUTH_CHANNEL = "kleff:auth";

/** Posts a sign-out event to all other open tabs. */
export function broadcastSignout() {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    new BroadcastChannel(AUTH_CHANNEL).postMessage("signout");
  }
}

/** Posts a sign-in event to all other open tabs. */
export function broadcastSignin() {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    new BroadcastChannel(AUTH_CHANNEL).postMessage("signin");
  }
}

/** Syncs the OIDC session with the in-memory bearer token and CurrentUserContext. */
function CurrentUserProvider({ children }: { children: ReactNode }) {
  const auth = useOidcAuth();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Listen for sign-out events broadcast from other tabs and clear the local
  // session so the layout redirects to login without waiting for a page refresh.
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (e) => {
      if (e.data === "signout") auth.removeUser();
      // Another tab signed in (possibly as a different user) — navigate to
      // dashboard so this tab picks up the new token from localStorage.
      if (e.data === "signin") window.location.replace("/dashboard");
    };
    return () => channel.close();
  }, [auth.removeUser]);

  // When a hard auth failure occurs (refresh token expired, user disabled, etc.)
  // clear the stale session so the layout redirects to login.
  // Transient errors (network blips, silent_renew_error) are ignored so the
  // library can retry on the next automaticSilentRenew cycle instead of
  // immediately logging the user out.
  useEffect(() => {
    if (!auth.error) return;
    const msg = auth.error.message ?? "";
    const isHardFailure =
      msg.includes("login_required") ||
      msg.includes("invalid_grant") ||
      msg.includes("session_not_found") ||
      msg.includes("account_disabled");
    if (isHardFailure) {
      clearApiAccessToken();
      auth.removeUser();
    }
  }, [auth.error, auth.removeUser]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      setApiAccessToken(auth.user.access_token);
      fetchCurrentUser()
        .then(setCurrentUser)
        .catch(() => {
          setCurrentUser({ userId: auth.user?.profile?.sub ?? "", email: auth.user?.profile?.email ?? "", roles: [] });
        });
    } else if (!auth.isLoading) {
      // Only clear once OIDC has finished loading — avoids wiping the token
      // during the brief session-restore window before isAuthenticated becomes true.
      clearApiAccessToken();
      setCurrentUser(null);
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.access_token]);

  // Hold rendering while OIDC session is being restored so child components
  // don't fire API calls before the bearer token is available.
  if (auth.isLoading) return null;

  return (
    <CurrentUserContext.Provider value={currentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * Bootstraps auth dynamically from GET /api/v1/auth/config.
 * - If the active IDP plugin returns enabled:true, wraps children in OidcProvider.
 * - If no IDP plugin is active (enabled:false), renders children directly — auth is disabled.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    fetchAuthConfig().then(setAuthConfig).catch(() => setAuthConfig({ enabled: false }));
  }, []);

  // IDP plugin installed but container still starting — poll every 3 s until ready.
  useEffect(() => {
    if (!authConfig) return;
    if (authConfig.setup_required || authConfig.ready) return;
    const id = setInterval(() => {
      fetchAuthConfig()
        .then(setAuthConfig)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [authConfig?.setup_required, authConfig?.ready]);

  // Still loading — render nothing to avoid a flash of unauthenticated state.
  if (authConfig === null) return null;

  if (!authConfig.enabled || !authConfig.authority || !authConfig.client_id) {
    // No IDP configured — pass children through without OIDC context.
    return (
      <AuthConfigContext.Provider value={authConfig}>
        <CurrentUserContext.Provider value={null}>
          {children}
        </CurrentUserContext.Provider>
      </AuthConfigContext.Provider>
    );
  }

  const isRedirect = authConfig.auth_mode === "redirect";
  const oidcConfig = {
    authority: authConfig.authority,
    client_id: authConfig.client_id,
    scope: authConfig.scopes?.join(" ") ?? "openid profile email",
    ...oidcStaticConfig,
    // Headless mode: store tokens in localStorage so all tabs share the session.
    // Redirect mode: keep the default sessionStorage (cross-tab logout is handled
    // by the IDP browser cookie + monitorSession instead).
    ...(!isRedirect && {
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }),
    // Redirect mode: monitor the IDP session so cross-tab logouts are detected
    // instantly, and clean up the URL after the OIDC callback redirect.
    ...(isRedirect && {
      monitorSession: true,
      onSigninCallback: () => {
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      },
    }),
  };

  return (
    <AuthConfigContext.Provider value={authConfig}>
      <OidcProvider {...oidcConfig}>
        <CurrentUserProvider>{children}</CurrentUserProvider>
      </OidcProvider>
    </AuthConfigContext.Provider>
  );
}
