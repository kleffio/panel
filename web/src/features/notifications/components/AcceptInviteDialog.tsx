"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderGit2, AlertCircle, X } from "lucide-react";
import { Button, Badge, cn } from "@kleffio/ui";
import { Spinner } from "@/components/ui/Spinner";
import { resolveProjectInvite, acceptProjectInvite } from "@/lib/api/projects";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  maintainer: "Maintainer",
  developer: "Developer",
  viewer: "Viewer",
};

interface Props {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted?: () => void;
}

export function AcceptInviteDialog({ token, open, onOpenChange, onAccepted }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-invite", token],
    queryFn: () => resolveProjectInvite(token),
    enabled: open && !!token,
    retry: false,
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptProjectInvite(token),
    onSuccess: () => {
      toast.success(`Welcome to ${data?.project_name ?? "the project"}!`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      onAccepted?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to accept invite."),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-white/[0.08] bg-background p-6 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground/40 transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="size-10 text-destructive" />
              <p className="text-sm font-medium">This invite link is invalid or has expired.</p>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                  <FolderGit2 className="size-5 text-primary" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold">
                    You&apos;ve been invited
                  </Dialog.Title>
                  <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                    Join project{" "}
                    <span className="font-medium text-foreground">
                      {data.project_name ?? data.project_id}
                    </span>
                    .
                  </Dialog.Description>
                </div>
              </div>

              <div className="mb-5 rounded-lg border border-border bg-white/[0.03] px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{data.project_name ?? data.project_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="outline">{ROLE_LABELS[data.role] ?? data.role}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => acceptMut.mutate()}
                  disabled={acceptMut.isPending}
                >
                  {acceptMut.isPending && <Spinner size="xs" className="mr-1.5" />}
                  {acceptMut.isPending ? "Joining…" : "Accept invite"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Decline
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
