"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { setApiAccessToken, clearApiAccessToken, setOnUnauthorized, setTokenRefresher } from "@/lib/api";
import { CurrentUserContext, AuthConfigContext, type CurrentUser } from "./context";
import { fetchCurrentUser, fetchAuthConfig, refreshTokens, type AuthConfig } from "./api";
import { getStoredSession, storeApiTokens } from "./store-tokens";

// Non-OIDC fields that are always the same regardless of IDP.
const oidcStaticConfig = {
  // redirect_uri is required by oidc-client-ts even in headless mode.
  redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
  // post_logout_redirect_uri tells Keycloak where to send the user after logout.
  // When id_token_hint is present (which oidc-client-ts sends automatically),
  // Keycloak skips its own "You are logged out" page and redirects silently.
  post_logout_redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/auth/login` : "",
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
function CurrentUserProvider({
  children,
  authority,
  clientId,
  isRedirect,
}: {
  children: ReactNode;
  authority: string;
  clientId: string;
  isRedirect: boolean;
}) {
  const auth = useOidcAuth();
  const authRef = useRef(auth);
  authRef.current = auth;
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const refreshHeadlessTokens = async (): Promise<string | null> => {
    const stored = getStoredSession(authority, clientId);
    const refreshToken = stored?.refresh_token;
    if (!refreshToken) return null;
    const tok = await refreshTokens(refreshToken);
    storeApiTokens(tok, authority, clientId);
    setApiAccessToken(tok.access_token);
    return tok.access_token;
  };

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
      msg.includes("session_not_found") ||
      msg.includes("account_disabled");
    if (isHardFailure) {
      clearApiAccessToken();
      auth.removeUser();
    }
  }, [auth.error, auth.removeUser]);

  // oidc-client-ts does not retry automaticSilentRenew after a failure — it
  // only schedules one timer per token. If the renew fails (network blip,
  // transient Keycloak error), the token sits expired until something triggers
  // a 401. This effect listens for the silentRenewError event and retries with
  // a short delay so the token is recovered without needing a page reload.
  useEffect(() => {
    if (!isRedirect) return;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const onError = () => {
      attempt += 1;
      const delay = Math.min(5_000 * attempt, 60_000); // 5s, 10s, … up to 60s
      retryTimer = setTimeout(async () => {
        try {
          await authRef.current.signinSilent();
          attempt = 0;
        } catch {
          // next silentRenewError event will trigger another retry
        }
      }, delay);
    };

    auth.events.addSilentRenewError(onError);
    return () => {
      auth.events.removeSilentRenewError(onError);
      if (retryTimer !== null) clearTimeout(retryTimer);
    };
  }, [auth.events, isRedirect]);

  useEffect(() => {
    setTokenRefresher(async () => {
      if (!isRedirect) {
        try {
          return await refreshHeadlessTokens();
        } catch {
          return null;
        }
      }
      // Always read from the ref so we see the latest token even if automaticSilentRenew
      // already renewed it after this effect last ran. Using auth directly here would
      // capture a stale closure and cause a redundant signinSilent() that sends the
      // already-rotated refresh token to Keycloak, producing a 400 → logout.
      const current = authRef.current;
      if (current.user?.access_token && !current.user.expired) {
        return current.user.access_token;
      }
      try {
        const user = await current.signinSilent();
        return user?.access_token ?? null;
      } catch {
        return null;
      }
    });
    setOnUnauthorized(() => {
      clearApiAccessToken();
      authRef.current.removeUser();
    });
    return () => {
      setTokenRefresher(null);
      setOnUnauthorized(() => {});
    };
  }, [authority, clientId, isRedirect]);

  // If the stored token is already expired on mount (stale localStorage from a previous
  // session), automaticSilentRenew won't schedule a timer because the renew window has
  // already passed. Kick off signinSilent immediately so the session is recovered without
  // requiring a page reload or a 401 to trigger the tokenRefresher.
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.expired) {
      if (isRedirect) {
        auth.signinSilent().catch(() => {});
      } else {
        refreshHeadlessTokens().catch(() => {});
      }
    }
  // auth.user is a new object reference on every render; key on the expired flag only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.user?.expired, isRedirect]);

  // Headless mode does not rely on oidc-client-ts silent renew. Refresh shortly
  // before expiry using the platform refresh endpoint and the latest stored token.
  useEffect(() => {
    if (isRedirect || !auth.isAuthenticated) return;
    const id = setInterval(() => {
      const stored = getStoredSession(authority, clientId);
      const expiresAt = stored?.expires_at;
      if (!expiresAt) return;
      const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);
      if (secondsLeft <= 60) {
        refreshHeadlessTokens().catch(() => {});
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [auth.isAuthenticated, authority, clientId, isRedirect]);

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
  // - 10 s while the IDP is starting up (ready: false)
  // - 60 s while the IDP is running — IDP switches are rare; no need to poll faster.
  useEffect(() => {
    if (!authConfig) return;
    if (authConfig.setup_required && authConfig.ready) return;
    const interval = authConfig.ready ? 60_000 : 10_000;
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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // Always supply metadata so oidc-client-ts never performs cross-origin OIDC
  // discovery (which would expose the IDP's real token endpoint to the browser).
  // token_endpoint is always proxied through the platform to avoid CORS — the
  // browser cannot POST directly to the IDP's cross-origin token endpoint.
  // Other endpoints are included when available; missing ones are simply omitted
  // (oidc-client-ts only requires what each flow actually uses).
  const oidcConfig = {
    authority: authConfig.authority,
    client_id: authConfig.client_id,
    scope: authConfig.scopes?.join(" ") ?? "openid profile email",
    ...oidcStaticConfig,
    automaticSilentRenew: isRedirect,
    metadata: {
      issuer: authConfig.authority,
      ...(authConfig.authorization_endpoint && { authorization_endpoint: authConfig.authorization_endpoint }),
      token_endpoint: `${origin}/api/v1/auth/token-exchange`,
      ...(authConfig.userinfo_endpoint && { userinfo_endpoint: authConfig.userinfo_endpoint }),
      ...(authConfig.end_session_endpoint && { end_session_endpoint: authConfig.end_session_endpoint }),
      ...(authConfig.jwks_uri && { jwks_uri: authConfig.jwks_uri }),
    },
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
        <CurrentUserProvider authority={authConfig.authority} clientId={authConfig.client_id} isRedirect={isRedirect}>
          {children}
        </CurrentUserProvider>
      </OidcProvider>
    </AuthConfigContext.Provider>
  );
}
