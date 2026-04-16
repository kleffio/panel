"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AnimatedPlaceholderInput,
  Button,
  LetterWave,
  Label,
  Skeleton,
} from "@kleffio/ui";
import { ArrowRightIcon, LockIcon, TriangleAlertIcon, UserIcon } from "lucide-react";

import { useAuth, storeApiTokens, login, broadcastSignin } from "@/features/auth";
import { AuthConfigContext } from "@/features/auth/context";
import { IDPStartingSpinner } from "@/features/auth/ui/IDPStartingSpinner";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";

function LoginSkeleton() {
  return (
    <>
      <div className="mb-10 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-3/4" />
      </div>
      <div className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </>
  );
}

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
    // No IDP installed - send to setup wizard.
    if (authConfig?.setup_required) {
      router.replace("/setup");
      return;
    }
    if (auth.isAuthenticated) {
      router.replace("/overview");
      return;
    }
    // Redirect mode: hand off to the IDP login page instead of the headless form.
    // Guard on ready so we do not signinRedirect while the IDP is switching -
    // authConfig in context may still point at the previous IDP until the next poll.
    if (!auth.isLoading && authConfig?.enabled && authConfig.ready && authConfig.auth_mode === "redirect") {
      auth.signinRedirect();
    }
  }, [auth.isAuthenticated, auth.isLoading, authConfig?.enabled, authConfig?.ready, authConfig?.auth_mode, authConfig?.setup_required, router]);

  // Setup redirect pending - render nothing while the router replaces the URL.
  if (authConfig?.setup_required) {
    return null;
  }

  // IDP plugin active but EnsureSetup still running (Authentik/Keycloak still starting).
  // AuthProvider polls every 3 s - show spinner until ready: true.
  if (authConfig?.enabled && !authConfig.ready) {
    return <IDPStartingSpinner variant="pane" />;
  }

  if (auth.isLoading && !loading) {
    return <LoginSkeleton />;
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
      window.location.replace("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-10 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
          <LetterWave text="Welcome back" />
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Sign in to manage your app
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <TriangleAlertIcon className="size-4" />
          <AlertTitle>Could not sign you in</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username or email</Label>
          <AnimatedPlaceholderInput
            id="username"
            icon={UserIcon}
            autoComplete="username"
            placeholder="Enter username or email"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <AnimatedPlaceholderInput
            id="password"
            icon={LockIcon}
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="mt-3 h-12 w-full rounded-full bg-gradient-kleff text-primary-foreground shadow-[0_18px_40px_rgba(196,143,0,0.22)] hover:opacity-95"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
          {!loading && <ArrowRightIcon className="size-4" />}
        </Button>
      </form>

      <div className="mt-8 space-y-3 text-center">
        {!loginConfig?.disable_signup_link && (
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Create an account
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
