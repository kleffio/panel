"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword } from "@/lib/api/plugins";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";
import { ExternalLink } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@kleffio/ui";
import { Spinner } from "@/components/ui/Spinner";

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast.success("Password changed.");
      setCurrent(""); setNext(""); setConfirm("");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not change password.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast.error("New passwords do not match."); return; }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="max-w-sm" autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" type="password" value={next} onChange={(e) => setNext(e.target.value)} className="max-w-sm" autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="max-w-sm" autoComplete="new-password" />
      </div>
      <Button type="submit" size="sm" disabled={mutation.isPending || !current || !next || !confirm}>
        {mutation.isPending && <Spinner size="xs" className="mr-1.5" />}
        {mutation.isPending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}

export function AccountSecurityPage() {
  const { profileSections } = useBackendPlugins();

  const securitySections = profileSections.filter(
    (s) => s.actions?.includes("change_password")
  );

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your password and two-factor authentication.</p>
      </div>

      {securitySections.length > 0 ? (
        securitySections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{section.label}</CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </div>
              {section.iframe_url && !section.actions?.length && (
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <a href={section.iframe_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Open
                  </a>
                </Button>
              )}
            </CardHeader>
            {section.actions?.includes("change_password") && (
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            )}
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
