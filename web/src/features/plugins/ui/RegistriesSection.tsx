"use client";

import { useState } from "react";
import { Plus, RefreshCw, Trash2, Globe, AlertTriangle, ChevronDown, Power } from "lucide-react";
import { Badge, Button, Input } from "@kleffio/ui";
import {
  listRegistries,
  addRegistry,
  deleteRegistry,
  toggleRegistry,
  refreshRegistry,
  listConflicts,
  resolveConflict,
  listPreferences,
  resetPreference,
  type PluginRegistry,
  type PluginConflict,
  type RegistryPreference,
} from "@/lib/api/plugins";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const conflictNameCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

function compareConflictsByName(a: PluginConflict, b: PluginConflict) {
  const byName = conflictNameCollator.compare(a.plugin_name, b.plugin_name);
  if (byName !== 0) return byName;
  return conflictNameCollator.compare(a.plugin_id, b.plugin_id);
}

function compareConflictSourcesByName(
  a: PluginConflict["registries"][number],
  b: PluginConflict["registries"][number]
) {
  const byRegistry = conflictNameCollator.compare(a.registry_name, b.registry_name);
  if (byRegistry !== 0) return byRegistry;

  const byVersion = conflictNameCollator.compare(a.version, b.version);
  if (byVersion !== 0) return byVersion;

  return conflictNameCollator.compare(a.registry_id, b.registry_id);
}

export function RegistriesSection() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["plugin-registries"],
    queryFn: listRegistries,
  });

  const registries = data?.registries ?? [];
  const enabledCount = registries.filter((r) => r.is_active).length;

  const { data: conflictsData } = useQuery({
    queryKey: ["plugin-registry-conflicts"],
    queryFn: listConflicts,
    enabled: enabledCount >= 2,
  });
  const conflicts = conflictsData?.conflicts ?? [];

  const { data: prefsData } = useQuery({
    queryKey: ["plugin-registry-preferences"],
    queryFn: listPreferences,
    enabled: showPrefs && enabledCount >= 2,
  });
  const preferences = prefsData?.preferences ?? [];

  const addMut = useMutation({
    mutationFn: () => addRegistry(newName.trim(), newUrl.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registries"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
      setAdding(false);
      setNewName("");
      setNewUrl("");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRegistry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registries"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleRegistry(id, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registries"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  const refreshMut = useMutation({
    mutationFn: refreshRegistry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registries"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  const resolveMut = useMutation({
    mutationFn: ({ pluginId, registryId }: { pluginId: string; registryId: string }) =>
      resolveConflict(pluginId, registryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-preferences"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  const resetPrefMut = useMutation({
    mutationFn: resetPreference,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin-registry-conflicts"] });
      qc.invalidateQueries({ queryKey: ["plugin-registry-preferences"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  function isCoolingDown(r: PluginRegistry) {
    return !!r.cooldown_until && new Date(r.cooldown_until) > new Date();
  }

  function cooldownLabel(r: PluginRegistry) {
    if (!r.cooldown_until) return null;
    const secs = Math.ceil((new Date(r.cooldown_until).getTime() - Date.now()) / 1000);
    if (secs <= 0) return null;
    return secs < 60 ? `${secs}s` : `${Math.ceil(secs / 60)}m`;
  }

  const unresolvedConflicts = conflicts
    .filter((c) => !c.preferred_registry_id)
    .sort(compareConflictsByName);
  const unresolvedCount = unresolvedConflicts.length;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Registry Sources</span>
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
              <AlertTriangle className="size-3" />
              {unresolvedCount} conflict{unresolvedCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-3.5" />
          Add Source
        </Button>
      </div>

      {adding && (
        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                placeholder="e.g. Internal Registry"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Registry URL</label>
              <Input
                placeholder="https://raw.githubusercontent.com/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={addMut.isPending || !newName.trim() || !newUrl.trim()}
              onClick={() => addMut.mutate()}
            >
              {addMut.isPending ? "Adding…" : "Add"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => { setAdding(false); setError(null); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="px-5 py-4 text-sm text-muted-foreground">Loading…</div>
      ) : registries.length === 0 ? (
        <div className="px-5 py-4 text-sm text-muted-foreground">No registries configured.</div>
      ) : (
        <ul className="divide-y divide-border">
          {registries.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  {r.is_active ? (
                    <Badge variant="outline" className="text-xs h-5 px-1.5 text-emerald-400 border-emerald-400/30">Enabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs h-5 px-1.5 text-muted-foreground">Disabled</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">{r.url}</span>
                  {r.last_synced_at && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      · synced {new Date(r.last_synced_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-7 text-xs gap-1 ${r.is_active ? "text-emerald-400" : "text-muted-foreground"}`}
                  disabled={toggleMut.isPending}
                  onClick={() => toggleMut.mutate({ id: r.id, enabled: !r.is_active })}
                  title={r.is_active ? "Disable registry" : "Enable registry"}
                >
                  <Power className="size-3.5" />
                  {r.is_active ? "On" : "Off"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  disabled={refreshMut.isPending || isCoolingDown(r)}
                  onClick={() => refreshMut.mutate(r.id)}
                  title={isCoolingDown(r) ? `Cooldown: ${cooldownLabel(r)}` : "Refresh catalog"}
                >
                  <RefreshCw className="size-3.5" />
                  {isCoolingDown(r) ? cooldownLabel(r) : "Sync"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(r.id)}
                  title="Remove registry"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Conflicts section */}
      {unresolvedConflicts.length > 0 && (
        <div className="border-t border-border">
          <div className="px-5 py-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              Plugin Conflicts ({unresolvedConflicts.length})
            </span>
          </div>
          <ul className="divide-y divide-border">
            {unresolvedConflicts.map((c) => (
              <li key={c.plugin_id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium">{c.plugin_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.plugin_id}</span>
                  </div>
                  {c.preferred_registry_id ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-400 border-emerald-400/30">Resolved</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Unresolved</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...c.registries].sort(compareConflictSourcesByName).map((src) => (
                    <button
                      key={src.registry_id}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        c.preferred_registry_id === src.registry_id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground"
                      }`}
                      disabled={resolveMut.isPending}
                      onClick={() => resolveMut.mutate({ pluginId: c.plugin_id, registryId: src.registry_id })}
                    >
                      <span className="font-medium">{src.registry_name}</span>
                      <span className="ml-1.5 opacity-60">v{src.version}</span>
                      <span className="ml-1.5 opacity-40">by {src.author}</span>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preferences management */}
      {enabledCount >= 2 && (
        <div className="border-t border-border">
          <button
            type="button"
            className="w-full px-5 py-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPrefs((v) => !v)}
          >
            <ChevronDown className={`size-3.5 transition-transform ${showPrefs ? "rotate-180" : ""}`} />
            Registry Preferences ({preferences.length})
          </button>
          {showPrefs && (
            <div className="px-5 pb-4 animate-in fade-in duration-200">
              {preferences.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No manual preferences set. Plugins default to the oldest registry source.
                </p>
              ) : (
                <ul className="space-y-2">
                  {preferences.map((pref) => {
                    const conflict = conflicts.find((c) => c.plugin_id === pref.plugin_id);
                    const regName = conflict?.registries.find((s) => s.registry_id === pref.registry_id)?.registry_name
                      ?? registries.find((r) => r.id === pref.registry_id)?.name
                      ?? pref.registry_id;
                    return (
                      <li key={pref.plugin_id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <div>
                          <span className="text-sm font-medium">{conflict?.plugin_name ?? pref.plugin_id}</span>
                          <span className="text-xs text-muted-foreground ml-2">→ {regName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          disabled={resetPrefMut.isPending}
                          onClick={() => resetPrefMut.mutate(pref.plugin_id)}
                          title="Reset to auto (oldest registry wins)"
                        >
                          Reset
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
