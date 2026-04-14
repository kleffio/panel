"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, CheckCircle, ExternalLink, Search, ChevronDown, Check, Loader2 } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Switch,
} from "@kleffio/ui";
import { getCatalog, getInstalledPlugins, getPlugin, installPlugin, uninstallPlugin, updatePluginConfig, setActiveIDP } from "@/lib/api/plugins";
import { useHasRole, clearStoredSession, broadcastSignout } from "@/features/auth";
import type { CatalogPlugin, ConfigField } from "@/lib/api/plugins";

const TYPE_LABELS: Record<string, string> = {
  ui: "UI",
  idp: "Identity Provider",
};

type SheetMode = "install" | "edit" | "activate";

// ─── Dependency install sheet ─────────────────────────────────────────────────

interface DepsSheetProps {
  /** The plugin that needs its deps installed before we can proceed. */
  plugin: CatalogPlugin | null;
  /** All catalog plugins — needed to look up dep names/descriptions. */
  catalog: CatalogPlugin[];
  /** Currently installed plugin IDs. */
  installedIds: Set<string>;
  /** Called when an individual dep is successfully installed. */
  onDepInstalled: (id: string) => void;
  /** Called when the user dismisses without continuing. */
  onClose: () => void;
  /** Called when all deps are met and the user clicks Continue. */
  onContinue: () => void;
}

function DepsSheet({ plugin, catalog, installedIds, onDepInstalled, onClose, onContinue }: DepsSheetProps) {
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installingAll, setInstallingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deps = useMemo(() => {
    if (!plugin) return [];
    return (plugin.dependencies ?? []).map((depId) => ({
      id: depId,
      catalog: catalog.find((p) => p.id === depId) ?? null,
      installed: installedIds.has(depId),
    }));
  }, [plugin, catalog, installedIds]);

  const allInstalled = deps.every((d) => d.installed);
  const unmetDeps = deps.filter((d) => !d.installed);

  async function installDep(depId: string) {
    setError(null);
    setInstallingId(depId);
    try {
      await installPlugin(depId, {});
      onDepInstalled(depId);
    } catch (err: any) {
      const msg = (err?.data as any)?.error ?? err?.message ?? "Install failed.";
      setError(`Failed to install ${depId}: ${msg}`);
    } finally {
      setInstallingId(null);
    }
  }

  async function installAll() {
    setError(null);
    setInstallingAll(true);
    for (const dep of unmetDeps) {
      try {
        await installPlugin(dep.id, {});
        onDepInstalled(dep.id);
      } catch (err: any) {
        const msg = (err?.data as any)?.error ?? err?.message ?? "Install failed.";
        setError(`Failed to install ${dep.catalog?.name ?? dep.id}: ${msg}`);
        setInstallingAll(false);
        return;
      }
    }
    setInstallingAll(false);
  }

  return (
    <Sheet open={!!plugin} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Required dependencies</SheetTitle>
          <SheetDescription>
            <strong>{plugin?.name}</strong> requires the following plugins to be installed first.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 py-4">
          {deps.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${dep.installed ? "bg-emerald-500/10" : "bg-muted"}`}>
                  {dep.installed ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Package className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {dep.catalog?.name ?? dep.id}
                  </p>
                  {dep.catalog?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {dep.catalog.description}
                    </p>
                  )}
                </div>
              </div>
              {dep.installed ? (
                <Badge variant="outline" className="shrink-0 text-xs text-emerald-600 border-emerald-400/50">
                  Installed
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={installingId === dep.id || installingAll}
                  onClick={() => installDep(dep.id)}
                >
                  {installingId === dep.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Install"
                  )}
                </Button>
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <SheetFooter className="flex-col gap-2 px-4">
          {!allInstalled && (
            <Button
              variant="outline"
              className="w-full"
              disabled={installingAll || installingId !== null}
              onClick={installAll}
            >
              {installingAll ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Installing…
                </>
              ) : unmetDeps.length === 1 ? (
                `Install ${unmetDeps[0].catalog?.name ?? unmetDeps[0].id}`
              ) : (
                `Install all (${unmetDeps.length})`
              )}
            </Button>
          )}
          <Button
            className="w-full"
            disabled={!allInstalled}
            onClick={() => { onClose(); onContinue(); }}
          >
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const isAdmin = useHasRole("admin");
  const [plugins, setPlugins] = useState<CatalogPlugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [activeIDPId, setActiveIDPId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Config sheet state
  const [configPlugin, setConfigPlugin] = useState<CatalogPlugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configError, setConfigError] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("install");
  const [saving, setSaving] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [alreadyInstalledActivate, setAlreadyInstalledActivate] = useState(false);

  // Dependency sheet state
  const [depsPlugin, setDepsPlugin] = useState<CatalogPlugin | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [search, setSearch] = useState("");
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [filterOfficial, setFilterOfficial] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    getCatalog().then((r) => setPlugins(r.plugins ?? []));
    getInstalledPlugins().then((r) => {
      const installed = r.plugins ?? [];
      setInstalledIds(new Set(installed.map((p) => p.id)));
      const active = installed.find((p) => p.is_active_idp);
      if (active) setActiveIDPId(active.id);
    });
  }, []);

  const categories = useMemo(() => {
    const types = Array.from(new Set(plugins.map((p) => p.type)));
    return types.sort();
  }, [plugins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plugins.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterInstalled && !installedIds.has(p.id)) return false;
      if (filterOfficial && !p.verified) return false;
      if (filterCategory && p.type !== filterCategory) return false;
      return true;
    });
  }, [plugins, search, filterInstalled, filterOfficial, filterCategory, installedIds]);

  function extractError(err: any, fallback: string): string {
    return (err?.data as any)?.error ?? err?.message ?? fallback;
  }

  /** Check for unmet deps; if any exist open the deps sheet and queue the action, otherwise run immediately. */
  function withDepsCheck(plugin: CatalogPlugin, action: () => void) {
    const unmet = (plugin.dependencies ?? []).filter((d) => !installedIds.has(d));
    if (unmet.length > 0) {
      setDepsPlugin(plugin);
      setPendingAction(() => action);
    } else {
      action();
    }
  }

  function openSheet(plugin: CatalogPlugin, mode: SheetMode) {
    const defaults: Record<string, string> = {};
    for (const field of plugin.config ?? []) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setConfigError(null);
    setSheetMode(mode);
    setAdvancedMode(false);
    setConfigPlugin(plugin);
  }

  async function prefillEdit(plugin: CatalogPlugin) {
    const defaults: Record<string, string> = {};
    for (const field of plugin.config ?? []) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setConfigError(null);
    setSheetMode("edit");
    setAdvancedMode(false);
    setConfigPlugin(plugin);
    try {
      const detail = await getPlugin(plugin.id);
      setConfigValues((prev) => ({ ...prev, ...(detail.config ?? {}) }));
    } catch {
      // Proceed with defaults
    }
  }

  // IDP activate: always open the config sheet so the user can review settings.
  async function openActivate(plugin: CatalogPlugin) {
    setActionError(null);
    if (installedIds.has(plugin.id)) {
      setAlreadyInstalledActivate(true);
      const defaults: Record<string, string> = {};
      for (const field of plugin.config ?? []) {
        if (field.default) defaults[field.key] = field.default;
      }
      setConfigValues(defaults);
      setConfigError(null);
      setSheetMode("activate");
      setAdvancedMode(false);
      setConfigPlugin(plugin);
      try {
        const detail = await getPlugin(plugin.id);
        setConfigValues((prev) => ({ ...prev, ...(detail.config ?? {}) }));
      } catch {
        // Proceed with defaults
      }
    } else {
      setAlreadyInstalledActivate(false);
      openSheet(plugin, "activate");
    }
  }

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configPlugin) return;

    const fields = configPlugin.config ?? [];
    for (const field of fields) {
      if (field.required && !configValues[field.key]?.trim()) {
        setConfigError(`"${field.label}" is required.`);
        return;
      }
    }

    if (sheetMode === "edit") {
      setSaving(true);
      setConfigError(null);
      try {
        await updatePluginConfig(configPlugin.id, configValues);
        setConfigPlugin(null);
      } catch (err: any) {
        setConfigError(extractError(err, "Update failed."));
      } finally {
        setSaving(false);
      }
    } else if (sheetMode === "activate") {
      setActivating(configPlugin.id);
      setConfigError(null);
      try {
        if (!alreadyInstalledActivate) {
          await installPlugin(configPlugin.id, configValues);
          setInstalledIds((s) => new Set(s).add(configPlugin.id));
        }
        await setActiveIDP(configPlugin.id);
        clearStoredSession();
        broadcastSignout();
        window.location.href = "/auth/login";
      } catch (err: any) {
        setConfigError(extractError(err, "Activate failed."));
        setActivating(null);
      }
    } else {
      // install mode
      setInstalling(configPlugin.id);
      setConfigError(null);
      try {
        await installPlugin(configPlugin.id, configValues);
        window.location.reload();
      } catch (err: any) {
        setConfigError(extractError(err, "Install failed."));
      } finally {
        setInstalling(null);
      }
    }
  }

  async function handleUninstall(id: string) {
    setActionError(null);

    // Pre-flight: find any installed plugins that declare this plugin as a dependency.
    const dependents = plugins.filter(
      (p) => installedIds.has(p.id) && (p.dependencies ?? []).includes(id)
    );
    if (dependents.length > 0) {
      const names = dependents.map((p) => p.name).join(", ");
      setActionError(
        `Cannot uninstall: ${dependents.length === 1 ? names : `[${names}]`} depends on this plugin. Uninstall ${dependents.length === 1 ? "it" : "them"} first.`
      );
      return;
    }

    setUninstalling(id);
    try {
      await uninstallPlugin(id);
      window.location.reload();
    } catch (err: any) {
      setActionError(extractError(err, "Uninstall failed."));
    } finally {
      setUninstalling(null);
    }
  }

  const normalFields = useMemo(() => {
    return (configPlugin?.config ?? []).filter((f) => !f.advanced);
  }, [configPlugin]);

  const advancedFields = useMemo(() => {
    return (configPlugin?.config ?? []).filter((f) => f.advanced);
  }, [configPlugin]);

  const hasAdvancedFields = advancedFields.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Browse and install plugins."
            : "Browse available UI plugins for your workspace."}
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search plugins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={filterInstalled ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setFilterInstalled((v) => !v)}
          >
            Installed
          </Button>
          <Button
            size="sm"
            variant={filterOfficial ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setFilterOfficial((v) => !v)}
          >
            Official
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filterCategory === cat ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setFilterCategory((prev) => (prev === cat ? "" : cat))}
            >
              {TYPE_LABELS[cat] ?? cat}
            </Button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No plugins match your filters.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => {
          const isInstalled = installedIds.has(plugin.id);
          const isActiveIDP = activeIDPId === plugin.id;
          const isIDP = plugin.type === "idp";
          const unmetDeps = (plugin.dependencies ?? []).filter((d) => !installedIds.has(d));
          const depsBlocked = unmetDeps.length > 0;

          return (
            <Card key={plugin.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">{plugin.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {plugin.verified && (
                      <CheckCircle className="size-3.5 text-emerald-400" />
                    )}
                    {isActiveIDP && (
                      <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-600">
                        Active
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[plugin.type] ?? plugin.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {plugin.description}
                </p>

                {plugin.tags && plugin.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plugin.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {plugin.dependencies && plugin.dependencies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plugin.dependencies.map((dep) => {
                      const depPlugin = plugins.find((p) => p.id === dep);
                      const depInstalled = installedIds.has(dep);
                      return (
                        <Badge
                          key={dep}
                          variant={depInstalled ? "outline" : "destructive"}
                          className="text-xs px-1.5 py-0"
                          title={depInstalled
                            ? `Requires ${depPlugin?.name ?? dep} (installed)`
                            : `Requires ${depPlugin?.name ?? dep} (not installed)`}
                        >
                          {depInstalled && <Check className="mr-1 size-2.5" />}
                          {depPlugin?.name ?? dep}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && isInstalled && (
                      <Button
                        size="sm"
                        variant={isActiveIDP ? "ghost" : "destructive"}
                        className={isActiveIDP ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
                        disabled={uninstalling === plugin.id || isActiveIDP}
                        title={isActiveIDP ? "Switch to another identity provider before uninstalling" : undefined}
                        onClick={() => handleUninstall(plugin.id)}
                      >
                        {uninstalling === plugin.id ? "Removing…" : "Uninstall"}
                      </Button>
                    )}
                    {isAdmin && isInstalled && (plugin.config ?? []).length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => prefillEdit(plugin)}
                      >
                        Edit
                      </Button>
                    )}
                    {isAdmin && isIDP && isInstalled && !isActiveIDP && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={activating === plugin.id}
                        onClick={() => withDepsCheck(plugin, () => openActivate(plugin))}
                      >
                        {activating === plugin.id ? "Activating…" : "Activate"}
                      </Button>
                    )}
                    {isAdmin && !isInstalled && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={installing === plugin.id}
                        onClick={() => withDepsCheck(plugin, () => openSheet(plugin, "install"))}
                      >
                        {installing === plugin.id ? "Installing…" : depsBlocked ? "Install…" : "Install"}
                      </Button>
                    )}
                    {plugin.verified && (
                      <a
                        href={`https://github.com/kleffio/plugins`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dependency install sheet */}
      <DepsSheet
        plugin={depsPlugin}
        catalog={plugins}
        installedIds={installedIds}
        onDepInstalled={(id) => {
          setInstalledIds((s) => new Set(s).add(id));
          window.dispatchEvent(new Event("kleff-reload-plugins"));
        }}
        onClose={() => { setDepsPlugin(null); setPendingAction(null); }}
        onContinue={() => { pendingAction?.(); setPendingAction(null); }}
      />

      {/* Config sheet */}
      <Sheet open={!!configPlugin} onOpenChange={(open) => { if (!open) setConfigPlugin(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "edit"
                ? `Edit ${configPlugin?.name}`
                : sheetMode === "activate"
                ? `Activate ${configPlugin?.name}`
                : `Install ${configPlugin?.name}`}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "Update the plugin configuration. Leave secret fields blank to keep current values."
                : sheetMode === "activate"
                ? "Fill in the configuration to activate this identity provider."
                : "Fill in the required configuration to install this plugin."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4 px-4 py-2">
            {normalFields.map((field) => (
              <ConfigFieldInput
                key={field.key}
                field={field}
                value={configValues[field.key] ?? ""}
                onChange={(v: string) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}

            {hasAdvancedFields && (
              <div className="space-y-4 pt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                  onClick={() => setAdvancedMode((v) => !v)}
                >
                  <ChevronDown className={`size-3.5 transition-transform ${advancedMode ? "rotate-180" : ""}`} />
                  {advancedMode ? "Hide advanced settings" : "Show advanced settings"}
                </button>

                {advancedMode && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {advancedFields.map((field) => (
                      <ConfigFieldInput
                        key={field.key}
                        field={field}
                        value={configValues[field.key] ?? ""}
                        onChange={(v: string) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {configError && (
              <p className="text-sm text-destructive">{configError}</p>
            )}

            <SheetFooter className="px-0 pt-2">
              <Button
                type="submit"
                disabled={activating === configPlugin?.id || installing === configPlugin?.id || saving}
                className="w-full"
              >
                {sheetMode === "edit"
                  ? (saving ? "Saving…" : "Save changes")
                  : sheetMode === "activate"
                  ? (activating === configPlugin?.id ? "Activating…" : "Activate")
                  : (installing === configPlugin?.id ? "Installing…" : "Install")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key} className="text-sm">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <Switch
          id={field.key}
          checked={value === "true"}
          onCheckedChange={(c) => onChange(c ? "true" : "false")}
        />
      ) : (
        <Input
          id={field.key}
          type={field.type === "secret" ? "password" : field.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.default ?? ""}
          className="h-9 text-sm"
        />
      )}

      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}
