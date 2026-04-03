"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, CheckCircle, ExternalLink, Search } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Input, Label,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@kleffio/ui";
import { getCatalog, getInstalledPlugins, installPlugin, uninstallPlugin, setActiveIDP } from "@/lib/api/plugins";
import { useHasRole } from "@/features/auth";
import type { CatalogPlugin, ConfigField } from "@/lib/api/plugins";

const TYPE_LABELS: Record<string, string> = {
  ui: "UI",
  idp: "Identity Provider",
};

export default function MarketplacePage() {
  const isAdmin = useHasRole("admin");
  const [plugins, setPlugins] = useState<CatalogPlugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [activeIDPId, setActiveIDPId] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  // Config sheet state
  const [configPlugin, setConfigPlugin] = useState<CatalogPlugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configError, setConfigError] = useState<string | null>(null);

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
      if (filterInstalled && !installedIds.has(p.id) && !justInstalled.has(p.id)) return false;
      if (filterOfficial && !p.verified) return false;
      if (filterCategory && p.type !== filterCategory) return false;
      return true;
    });
  }, [plugins, search, filterInstalled, filterOfficial, filterCategory, installedIds, justInstalled]);

  function extractError(err: any, fallback: string): string {
    return (err?.data as any)?.error ?? err?.message ?? fallback;
  }

  function openInstall(plugin: CatalogPlugin) {
    const hasConfig = plugin.config && plugin.config.length > 0;
    if (!hasConfig) {
      doInstall(plugin.id, {});
      return;
    }
    // Pre-fill defaults
    const defaults: Record<string, string> = {};
    for (const field of plugin.config!) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setConfigError(null);
    setConfigPlugin(plugin);
  }

  async function doInstall(id: string, config: Record<string, string>) {
    setActionError(null);
    setInstalling(id);
    try {
      await installPlugin(id, config);
      setJustInstalled((s) => new Set(s).add(id));
      setInstalledIds((s) => new Set(s).add(id));
      setConfigPlugin(null);
    } catch (err: any) {
      const msg = extractError(err, "Install failed.");
      if (configPlugin) {
        setConfigError(msg);
      } else {
        setActionError(msg);
      }
    } finally {
      setInstalling(null);
    }
  }

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configPlugin) return;
    // Validate required fields
    for (const field of configPlugin.config ?? []) {
      if (field.required && !configValues[field.key]?.trim()) {
        setConfigError(`"${field.label}" is required.`);
        return;
      }
    }
    await doInstall(configPlugin.id, configValues);
  }

  async function handleUninstall(id: string) {
    setActionError(null);
    setUninstalling(id);
    try {
      await uninstallPlugin(id);
      setInstalledIds((s) => { const next = new Set(s); next.delete(id); return next; });
      setJustInstalled((s) => { const next = new Set(s); next.delete(id); return next; });
      if (activeIDPId === id) setActiveIDPId(null);
    } catch (err: any) {
      setActionError(extractError(err, "Uninstall failed."));
    } finally {
      setUninstalling(null);
    }
  }

  async function handleActivate(id: string) {
    setActionError(null);
    setActivating(id);
    try {
      await setActiveIDP(id);
      setActiveIDPId(id);
    } catch (err: any) {
      setActionError(extractError(err, "Activate failed."));
    } finally {
      setActivating(null);
    }
  }

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

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && isInstalled && isIDP && !isActiveIDP && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activating === plugin.id}
                        onClick={() => handleActivate(plugin.id)}
                      >
                        {activating === plugin.id ? "Activating…" : "Activate"}
                      </Button>
                    )}
                    {isAdmin && (
                      isInstalled ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={uninstalling === plugin.id}
                          onClick={() => handleUninstall(plugin.id)}
                        >
                          {uninstalling === plugin.id ? "Removing…" : "Uninstall"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={installing === plugin.id}
                          onClick={() => openInstall(plugin)}
                        >
                          {installing === plugin.id ? "Installing…" : "Install"}
                        </Button>
                      )
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

      {/* Config sheet for plugins with required fields */}
      <Sheet open={!!configPlugin} onOpenChange={(open) => { if (!open) setConfigPlugin(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Install {configPlugin?.name}</SheetTitle>
            <SheetDescription>
              Fill in the required configuration to install this plugin.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4 px-4 py-2">
            {configPlugin?.config?.map((field) => (
              <ConfigFieldInput
                key={field.key}
                field={field}
                value={configValues[field.key] ?? ""}
                onChange={(v) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}

            {configError && (
              <p className="text-sm text-destructive">{configError}</p>
            )}

            <SheetFooter className="px-0 pt-2">
              <Button
                type="submit"
                disabled={installing === configPlugin?.id}
                className="w-full"
              >
                {installing === configPlugin?.id ? "Installing…" : "Install"}
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
        <select
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <input
          id={field.key}
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="size-4"
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
