"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { setApiAccessToken, clearApiAccessToken, setOnUnauthorized, setTokenRefresher } from "@/lib/api";
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
      if (e.data === "signin") window.location.replace("/");
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
    setTokenRefresher(async () => {
      try {
        const user = await auth.signinSilent();
        return user?.access_token ?? null;
      } catch {
        return null;
      }
    });
    setOnUnauthorized(() => {
      clearApiAccessToken();
      auth.removeUser();
    });
    return () => {
      setTokenRefresher(null);
      setOnUnauthorized(() => {});
    };
  }, [auth.signinSilent, auth.removeUser]);

  // Sync token to API client synchronously during render so queries 
  // fired by children on mount have the token immediately.
  if (auth.isAuthenticated && auth.user?.access_token) {
    setApiAccessToken(auth.user.access_token);
  } else if (!auth.isLoading) {
    clearApiAccessToken();
  }

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      fetchCurrentUser()
        .then(setCurrentUser)
        .catch(() => {
          setCurrentUser({ userId: auth.user?.profile?.sub ?? "", email: auth.user?.profile?.email ?? "", roles: [] });
        });
    } else if (!auth.isLoading) {
      setCurrentUser(null);
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.access_token]);

  // Heartbeat: poll /auth/me every 30 s while authenticated.
  // If this device's session was revoked by another device, the platform JWT
  // middleware will return 401 → setOnUnauthorized fires → auth.removeUser().
  // For Keycloak this is instant (in-process revocation set).
  // For Authentik this is within ~1 minute (userinfo cache TTL).
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const id = setInterval(() => {
      fetchCurrentUser().catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [auth.isAuthenticated]);

  return (
    <CurrentUserContext.Provider value={auth.isLoading ? null : currentUser}>
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

  // Poll authConfig so open tabs pick up IDP changes (e.g. switching IDPs).
  // - 3 s while the IDP is starting up (ready: false)
  // - 5 s while the IDP is running — fast enough to detect a switch within one
  //   polling cycle before the login page triggers a signinRedirect to the old IDP.
  useEffect(() => {
    if (!authConfig) return;
    if (authConfig.setup_required && authConfig.ready) return;
    const interval = authConfig.ready ? 5_000 : 3_000;
    const id = setInterval(() => {
      fetchAuthConfig()
        .then((next) => {
          const idpChanged =
            next.authority !== authConfig.authority ||
            next.client_id !== authConfig.client_id ||
            next.enabled !== authConfig.enabled;
          if (idpChanged) {
            // Full reload to clear stale oidc-client-ts state (session storage,
            // in-flight redirects). A React state update alone would leave
            // OidcProvider pointed at the old IDP and trigger a signinRedirect
            // to the stopped container.
            window.location.reload();
          } else if (next.ready !== authConfig.ready) {
            setAuthConfig(next);
          }
        })
        .catch(() => {});
    }, interval);
    return () => clearInterval(id);
  }, [authConfig?.setup_required, authConfig?.ready, authConfig?.authority, authConfig?.client_id, authConfig?.enabled]);

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
  // When the backend pre-fetches OIDC endpoints, pass them as metadata so
  // oidc-client-ts skips the cross-origin discovery document fetch entirely.
  // This avoids CORS issues when the IDP is on a different origin.
  const hasMetadata =
    authConfig.token_endpoint &&
    authConfig.authorization_endpoint &&
    authConfig.userinfo_endpoint &&
    authConfig.end_session_endpoint;
  const oidcConfig = {
    authority: authConfig.authority,
    client_id: authConfig.client_id,
    scope: authConfig.scopes?.join(" ") ?? "openid profile email",
    ...oidcStaticConfig,
    ...(hasMetadata && {
      metadata: {
        issuer: authConfig.authority,
        authorization_endpoint: authConfig.authorization_endpoint,
        // Proxy token exchange through the platform API to avoid CORS — the
        // browser cannot POST directly to the IDP's cross-origin token endpoint.
        token_endpoint: `${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/auth/token-exchange`,
        userinfo_endpoint: authConfig.userinfo_endpoint,
        end_session_endpoint: authConfig.end_session_endpoint,
        jwks_uri: authConfig.jwks_uri,
      },
    }),
    // Headless mode: store tokens in localStorage so all tabs share the session.
    // Redirect mode: keep the default sessionStorage (cross-tab logout is handled
    // by the IDP browser cookie + monitorSession instead).
    ...(!isRedirect && {
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }),
    // Redirect mode: clean up the URL after the OIDC callback redirect.
    // monitorSession is intentionally omitted — it requires check_session_iframe
    // from the IDP, which we don't include in our pre-fetched metadata, and
    // attempting it causes a login_required error that immediately clears the
    // just-stored tokens and triggers an infinite redirect loop.
    ...(isRedirect && {
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
