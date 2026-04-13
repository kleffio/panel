"use client";

import { useState, useContext } from "react";
import { useAuth, storeApiTokens, login, register, broadcastSignin } from "@/features/auth";
import { AuthConfigContext } from "@/features/auth/context";
import { useBackendPlugins } from "@/lib/plugins/use-backend-plugins";
import { Button } from "@kleffio/ui";
import { Input } from "@kleffio/ui";
import { Label } from "@kleffio/ui";
import { Skeleton } from "@kleffio/ui";

export default function SignupPage() {
  const auth = useAuth();
  const authConfig = useContext(AuthConfigContext);
  const { signupConfig } = useBackendPlugins();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect mode: send to IDP's registration page instead of the headless form.
  if (!auth.isLoading && authConfig?.enabled && authConfig.auth_mode === "redirect") {
    auth.signinRedirect({ extraQueryParams: { prompt: "create" } });
  }

  if (auth.isLoading) {
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
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register({ username, email, password, firstName, lastName });
      const tok = await login(username, password);
      storeApiTokens(tok, authConfig?.authority ?? "", authConfig?.client_id ?? "");
      broadcastSignin();
      window.location.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
          <h1 className="text-lg font-semibold text-foreground">Create an account</h1>
          <p className="text-sm text-muted-foreground">Enter your details to get started</p>
        </div>

        {signupConfig?.disabled ? (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-5 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Registration is managed externally</p>
            <p className="text-xs text-muted-foreground">
              Contact your administrator or sign up through your identity provider.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!signupConfig?.hide_first_name && !signupConfig?.hide_last_name && (
              <div className="flex gap-3">
                {!signupConfig?.hide_first_name && (
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                )}
                {!signupConfig?.hide_last_name && (
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            {!signupConfig?.hide_username && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}
