"use client";

import { useState, useEffect, useContext } from "react";
import { useAuth, storeApiTokens, login, broadcastSignin } from "@/features/auth";
import { AuthConfigContext } from "@/features/auth/context";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Skeleton } from "@kleffio/ui";
import { IDPStartingSpinner } from "@/features/auth/ui/IDPStartingSpinner";

export function LoginPage() {
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const { loginConfig } = useBackendPlugins();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No IDP installed — send to setup wizard.
    if (authConfig?.setup_required) {
      router.replace("/setup");
      return;
    }
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
      return;
    }
    // Redirect mode: hand off to the IDP login page instead of the headless form.
    // Guard on ready so we don't signinRedirect while the IDP is switching —
    // authConfig in context may still point at the previous IDP until the next poll.
    if (!auth.isLoading && authConfig?.enabled && authConfig.ready && authConfig.auth_mode === "redirect") {
      auth.signinRedirect();
    }
  }, [auth.isAuthenticated, auth.isLoading, authConfig?.enabled, authConfig?.ready, authConfig?.auth_mode, authConfig?.setup_required, router]);

  // Setup redirect pending — render nothing while the router replaces the URL.
  if (authConfig?.setup_required) {
    return null;
  }

  // IDP plugin active but EnsureSetup still running (Authentik/Keycloak still starting).
  // AuthProvider polls every 3 s — show spinner until ready: true.
  if (authConfig?.enabled && !authConfig.ready) {
    return <IDPStartingSpinner />;
  }

  if (auth.isLoading && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-48 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tok = await login(username, password);
      // Use the dynamic authority/client_id so the sessionStorage key matches
      // what OidcProvider will look up on the next page load.
      storeApiTokens(tok, authConfig?.authority ?? "", authConfig?.client_id ?? "");
      broadcastSignin();
      window.location.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Panel
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your game servers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username or email</Label>
            <Input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {!loginConfig?.disable_signup_link && (
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Create one
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
