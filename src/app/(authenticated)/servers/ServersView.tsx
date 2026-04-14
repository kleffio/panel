"use client";

import { useState } from "react";
import { Plus, Square, Play, RotateCcw, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PluginSlot } from "@/components/plugin/PluginSlot";
import { PluginWrapper } from "@/components/plugin/PluginWrapper";
import { NewServerSheet } from "@/components/domain/NewServerSheet";
import { Button } from "@kleffio/ui";
import { Input } from "@kleffio/ui";
import { listDeployments, stopServer, startServer, restartServer, deleteDeployment, type Deployment } from "@/lib/api/deployments";

function statusLabel(status: Deployment["status"]): string {
  switch (status) {
    case "pending":
    case "in_progress":
      return "Provisioning";
    case "restarting":
      return "Restarting";
    case "succeeded":
      return "Running";
    case "failed":
      return "Failed";
    case "rolled_back":
      return "Stopped";
  }
}

function statusClasses(status: Deployment["status"]): { dot: string; badge: string } {
  switch (status) {
    case "pending":
    case "in_progress":
      return { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-400/10 text-blue-400 ring-blue-400/20" };
    case "restarting":
      return { dot: "bg-yellow-400 animate-pulse", badge: "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20" };
    case "succeeded":
      return { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" };
    case "failed":
      return { dot: "bg-red-500", badge: "bg-red-500/10 text-red-400 ring-red-500/20" };
    case "rolled_back":
      return { dot: "bg-zinc-500", badge: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20" };
  }
}

function DeploymentCard({ deployment }: { deployment: Deployment }) {
  const queryClient = useQueryClient();

  const optimisticUpdate = (id: string, status: Deployment["status"]) => {
    queryClient.setQueryData<Deployment[]>(["deployments"], (old) =>
      old ? old.map((d) => d.id === id ? { ...d, status } : d) : old
    );
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deployments"] });

  const stop = useMutation({
    mutationFn: () => stopServer(deployment.id),
    onMutate: () => optimisticUpdate(deployment.id, "rolled_back"),
    onSettled: invalidate,
  });
  const start = useMutation({
    mutationFn: () => startServer(deployment.id),
    onMutate: () => optimisticUpdate(deployment.id, "in_progress"),
    onSettled: invalidate,
  });
  const restart = useMutation({
    mutationFn: () => restartServer(deployment.id),
    onMutate: () => optimisticUpdate(deployment.id, "restarting"),
    onSettled: invalidate,
  });
  const destroy = useMutation({ mutationFn: () => deleteDeployment(deployment.id), onSuccess: invalidate });

  const busy = stop.isPending || start.isPending || restart.isPending || destroy.isPending;
  const isRunning = deployment.status === "succeeded";
  const isStopped = deployment.status === "rolled_back" || deployment.status === "failed";
  const isTransitioning = deployment.status === "pending" || deployment.status === "in_progress" || deployment.status === "restarting";

  const { dot, badge } = statusClasses(deployment.status);

  const dimmed = busy || isTransitioning;

  return (
    <div className={`relative rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-4 transition-colors ${dimmed ? "opacity-60 pointer-events-none" : "hover:border-zinc-700"}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-50 truncate">{deployment.server_name}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {statusLabel(deployment.status)}
        </span>
      </div>
      {deployment.address ? (
        <p className="text-xs font-mono text-zinc-400">{deployment.address}</p>
      ) : (
        <p className="text-xs text-zinc-600 italic">Address not yet assigned</p>
      )}
      <p className="text-xs text-zinc-600">
        Created {new Date(deployment.created_at).toLocaleString()}
      </p>
      <div className="flex gap-2 pt-1">
        {!isTransitioning && isRunning && (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => stop.mutate()}>
              <Square className="size-3" />
              Stop
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => restart.mutate()}>
              <RotateCcw className="size-3" />
              Restart
            </Button>
          </>
        )}
        {!isTransitioning && isStopped && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => start.mutate()}>
            <Play className="size-3" />
            Start
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={busy} className="ml-auto text-red-400 hover:text-red-300" onClick={() => destroy.mutate()}>
          <Trash2 className="size-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function ServersView() {
  const [newServerOpen, setNewServerOpen] = useState(false);
  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ["deployments"],
    queryFn: listDeployments,
    refetchInterval: 5000,
  });

  const activeServerNames = deployments
    .filter((d) => d.status === "pending" || d.status === "in_progress" || d.status === "restarting" || d.status === "succeeded")
    .map((d) => d.server_name);

  return (
    <div className="space-y-6">
      {/* Plugin top */}
      <PluginSlot name="servers.top" />

      <PluginWrapper name="servers.header" className="flex items-center justify-between" slotProps={{ servers: deployments }}>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Game Servers</h1>
          <p className="text-sm text-muted-foreground">
            {deployments.length} server{deployments.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        <Button size="sm" onClick={() => setNewServerOpen(true)}>
          <Plus className="size-4" />
          New Server
        </Button>
      </PluginWrapper>

      <NewServerSheet open={newServerOpen} onOpenChange={setNewServerOpen} activeServerNames={activeServerNames} />

      <Input
        placeholder="Search servers…"
        className="max-w-sm"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading servers…</p>
      ) : deployments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No servers yet. Create one to get started.</p>
      ) : (
        <PluginWrapper name="servers.list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" slotProps={{ servers: deployments }}>
          {deployments.map((d) => (
            <DeploymentCard key={d.id} deployment={d} />
          ))}
        </PluginWrapper>
      )}

      {/* Plugin bottom */}
      <PluginSlot name="servers.bottom" />
    </div>
  );
}
