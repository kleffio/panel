"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Track whether a sign-in attempt is in flight so we can react to auth.error
  const signingIn = useRef(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, router]);

  // react-oidc-context catches navigator errors internally and puts them in auth.error
  useEffect(() => {
    if (signingIn.current && auth.error) {
      setError("Invalid username or password.");
      setLoading(false);
      signingIn.current = false;
    }
  }, [auth.error]);

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
    signingIn.current = true;
    await auth.signinResourceOwnerCredentials({ username, password });
    // If successful, the auth.isAuthenticated useEffect above handles the redirect.
    // If the provider doesn't support ROPC, fall back to redirect flow.
    // We don't set loading=false here — either the redirect happens or auth.error fires.
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
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => auth.signinRedirect({ extraQueryParams: { prompt: "create" } })}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
