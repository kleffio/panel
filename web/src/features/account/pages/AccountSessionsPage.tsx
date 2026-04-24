"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Monitor, Smartphone, Trash2, LogOut } from "lucide-react";
import { listSessions, revokeSession, revokeAllSessions } from "@/lib/api/plugins";
import { useAuth, clearStoredSession, broadcastSignout } from "@/features/auth";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@kleffio/ui";
import { Spinner } from "@/components/ui/Spinner";

function parseUA(ua?: string): { label: string; isMobile: boolean } {
  if (!ua) return { label: "Unknown device", isMobile: false };
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  let os = "";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return { label: [browser, os].filter(Boolean).join(" on ") || ua.slice(0, 60), isMobile };
}

function formatTime(unix?: number) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SessionsList({ sectionId, canRevoke }: { sectionId: string; canRevoke: boolean }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const sid = (auth.user?.profile?.sid as string | undefined) ?? auth.user?.session_state ?? undefined;
  const sessionsKey = ["sessions", sectionId, sid ?? ""] as const;

  const { data, isLoading } = useQuery({
    queryKey: sessionsKey,
    queryFn: () => listSessions(sid),
    enabled: auth.isAuthenticated && !!sid,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: async () => {
      try {
        const fresh = await listSessions(sid);
        const now = Math.floor(Date.now() / 1000);
        const remaining = (fresh?.sessions ?? []).filter(
          (s) => s.current || !s.expires_at || s.expires_at > now,
        );
        if (remaining.length === 0) {
          clearStoredSession();
          broadcastSignout();
          window.location.href = "/auth/login";
          return;
        }
        queryClient.setQueryData(sessionsKey, fresh);
        toast.success("Session revoked.");
      } catch {
        queryClient.invalidateQueries({ queryKey: sessionsKey });
        toast.success("Session revoked.");
      }
    },
    onError: () => toast.error("Could not revoke session."),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => revokeAllSessions(sid),
    onSuccess: async () => {
      try {
        const fresh = await listSessions(sid);
        const now = Math.floor(Date.now() / 1000);
        const remaining = (fresh?.sessions ?? []).filter(
          (s) => s.current || !s.expires_at || s.expires_at > now,
        );
        if (remaining.length === 0) {
          clearStoredSession();
          broadcastSignout();
          window.location.href = "/auth/login";
          return;
        }
        queryClient.setQueryData(sessionsKey, fresh);
        toast.success("All other sessions signed out.");
      } catch {
        queryClient.invalidateQueries({ queryKey: sessionsKey });
        toast.success("All other sessions signed out.");
      }
    },
    onError: () => toast.error("Could not sign out other sessions."),
  });

  const signOutSelfMutation = useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => { clearStoredSession(); broadcastSignout(); window.location.href = "/auth/login"; },
    onError: () => toast.error("Could not sign out."),
  });

  if (isLoading) return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="size-8 rounded-md shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );

  const now = Math.floor(Date.now() / 1000);
  const sessions = (data?.sessions ?? []).filter(
    (s) => s.current || !s.expires_at || s.expires_at > now,
  );
  const otherSessions = sessions.filter((s) => !s.current);

  if (sessions.length === 0) return <p className="text-sm text-muted-foreground">No active sessions found.</p>;

  return (
    <div className="space-y-3">
      {canRevoke && otherSessions.length > 0 && (
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            {otherSessions.length === 1 ? "1 other active session" : `${otherSessions.length} other active sessions`}
          </p>
          <Button
            variant="outline" size="sm"
            className="shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            disabled={revokeAllMutation.isPending || revokeMutation.isPending}
            onClick={() => revokeAllMutation.mutate()}
          >
            {revokeAllMutation.isPending ? <Spinner size="xs" className="mr-1.5" /> : <LogOut className="mr-1.5 size-3.5" />}
            Sign out all other devices
          </Button>
        </div>
      )}
      {sessions.map((session) => {
        const { label, isMobile } = parseUA(session.user_agent);
        const DeviceIcon = isMobile ? Smartphone : Monitor;
        return (
          <div key={session.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <DeviceIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{label}</span>
                  {session.current && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">This device</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.ip_address && `${session.ip_address} · `}
                  {session.last_access ? `Last active ${formatTime(session.last_access)}` : `Started ${formatTime(session.started_at)}`}
                  {session.expires_at && ` · Expires ${formatTime(session.expires_at)}`}
                </p>
              </div>
            </div>
            {canRevoke && !session.current && (
              <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={revokeMutation.isPending || revokeAllMutation.isPending || signOutSelfMutation.isPending}
                onClick={() => revokeMutation.mutate(session.id)}
              >
                {revokeMutation.isPending ? <Spinner size="xs" /> : <><Trash2 className="mr-1.5 size-3.5" />Sign out</>}
              </Button>
            )}
            {canRevoke && session.current && (
              <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={signOutSelfMutation.isPending || revokeMutation.isPending || revokeAllMutation.isPending}
                onClick={() => signOutSelfMutation.mutate(session.id)}
              >
                {signOutSelfMutation.isPending ? <Spinner size="xs" /> : <><LogOut className="mr-1.5 size-3.5" />Sign out</>}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AccountSessionsPage() {
  const { profileSections } = useBackendPlugins();
  const sessionSections = profileSections.filter((s) => s.actions?.includes("list_sessions"));

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">View and revoke active sessions across your devices.</p>
      </div>

      {sessionSections.length > 0 ? (
        sessionSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <SessionsList sectionId={section.id} canRevoke={!!section.actions?.includes("revoke_session")} />
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsList sectionId="default" canRevoke={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
