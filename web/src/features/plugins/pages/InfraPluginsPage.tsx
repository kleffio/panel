"use client";

import { Check, CheckCircle, ChevronDown, ExternalLink, Package, Search, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kleffio/ui";
import { useHasRole } from "@/features/auth";
import { useMarketplace } from "@/features/plugins/hooks/useMarketplace";
import { DepsSheet } from "@/features/plugins/ui/DepsSheet";
import { ConfigFieldInput } from "@/features/plugins/ui/ConfigFieldInput";
import { PLUGIN_TIER } from "@/features/plugins/model/types";
import type { CatalogPlugin } from "@/lib/api/plugins";

export function InfraPluginsPage() {
  const isAdmin = useHasRole("admin");
  const {
    plugins,
    installedIds,
    setInstalledIds,
    installing,
    uninstalling,
    activating,
    activeIDPId,
    actionError,
    configPlugin,
    setConfigPlugin,
    configValues,
    setConfigValues,
    configError,
    sheetMode,
    saving,
    advancedMode,
    setAdvancedMode,
    depsPlugin,
    setDepsPlugin,
    pendingAction,
    setPendingAction,
    search,
    setSearch,
    filterInstalled,
    setFilterInstalled,
    normalFields,
    advancedFields,
    hasAdvancedFields,
    withDepsCheck,
    openSheet,
    prefillEdit,
    openActivate,
    handleConfigSubmit,
    handleUninstall,
  } = useMarketplace();

  const infraPlugins = plugins.filter((p) => {
    const tier = PLUGIN_TIER[p.type] ?? "project";
    const q = search.trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filterInstalled && !installedIds.has(p.id)) return false;
    return tier === "infra";
  });

  function PluginCard({ plugin }: { plugin: CatalogPlugin }) {
    const isInstalled = installedIds.has(plugin.id);
    const isActiveIDP = activeIDPId === plugin.id;
    const isIDP = plugin.type === "idp";

    return (
      <div className="flex flex-col rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <Package className="size-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{plugin.name}</p>
                <p className="text-[10px] text-muted-foreground">by {plugin.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {plugin.verified && <CheckCircle className="size-3.5 text-emerald-400" />}
              {isActiveIDP && (
                <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-600 px-1.5 py-0">
                  Active
                </Badge>
              )}
              {isInstalled && !isActiveIDP && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Installed</Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {plugin.description}
          </p>

          {plugin.tags && plugin.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plugin.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
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
                  <Badge key={dep} variant={depInstalled ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0">
                    {depInstalled && <Check className="mr-1 size-2.5" />}
                    {depPlugin?.name ?? dep}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">v{plugin.version}</span>
          <div className="flex items-center gap-2">
            {isAdmin && isInstalled && (
              <Button
                size="sm"
                variant={isActiveIDP ? "ghost" : "destructive"}
                className={isActiveIDP ? "text-destructive hover:bg-destructive/10 h-7 text-xs" : "h-7 text-xs"}
                disabled={uninstalling === plugin.id || isActiveIDP}
                onClick={() => handleUninstall(plugin.id)}
              >
                {uninstalling === plugin.id ? "Removing…" : "Uninstall"}
              </Button>
            )}
            {isAdmin && isInstalled && (plugin.config ?? []).length > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => prefillEdit(plugin)}>
                Edit
              </Button>
            )}
            {isAdmin && isIDP && isInstalled && !isActiveIDP && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
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
                className="h-7 text-xs"
                disabled={installing === plugin.id}
                onClick={() => withDepsCheck(plugin, () => openSheet(plugin, "install"))}
              >
                {installing === plugin.id ? "Installing…" : "Install"}
              </Button>
            )}
            {plugin.verified && (
              <a href="https://github.com/kleffio/plugins" target="_blank" rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Infrastructure Plugins</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-level plugins that affect the entire Kleff installation.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-1.5">
          <ShieldCheck className="size-3.5 text-destructive" />
          <span className="text-xs font-medium text-destructive">Admin only</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search plugins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-card border-border"
          />
        </div>
        <Button
          size="sm"
          variant={filterInstalled ? "default" : "outline"}
          className="h-9 text-xs"
          onClick={() => setFilterInstalled((v) => !v)}
        >
          Installed
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {infraPlugins.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-card/40 px-6 py-12 text-center">
          <Package className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || filterInstalled ? "No plugins match your filters." : "No infrastructure plugins available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {infraPlugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      )}

      <DepsSheet
        plugin={depsPlugin}
        catalog={plugins}
        installedIds={installedIds}
        onDepInstalled={(id) => { setInstalledIds((s) => new Set(s).add(id)); window.dispatchEvent(new Event("kleff-reload-plugins")); }}
        onClose={() => { setDepsPlugin(null); setPendingAction(null); }}
        onContinue={() => { pendingAction?.(); setPendingAction(null); }}
      />

      <Sheet open={!!configPlugin} onOpenChange={(open) => { if (!open) setConfigPlugin(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "edit" ? `Edit ${configPlugin?.name}` : sheetMode === "activate" ? `Activate ${configPlugin?.name}` : `Install ${configPlugin?.name}`}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit" ? "Update the plugin configuration." : sheetMode === "activate" ? "Configure and activate this identity provider." : "Fill in the required configuration to install this plugin."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4 px-4 py-2">
            {normalFields.map((field) => (
              <ConfigFieldInput key={field.key} field={field} value={configValues[field.key] ?? ""} onChange={(v) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))} />
            ))}
            {hasAdvancedFields && (
              <div className="space-y-4 pt-1">
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit" onClick={() => setAdvancedMode((v) => !v)}>
                  <ChevronDown className={`size-3.5 transition-transform ${advancedMode ? "rotate-180" : ""}`} />
                  {advancedMode ? "Hide advanced" : "Show advanced"}
                </button>
                {advancedMode && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {advancedFields.map((field) => (
                      <ConfigFieldInput key={field.key} field={field} value={configValues[field.key] ?? ""} onChange={(v) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {configError && <p className="text-sm text-destructive">{configError}</p>}
            <SheetFooter className="px-0 pt-2">
              <Button type="submit" disabled={activating === configPlugin?.id || installing === configPlugin?.id || saving} className="w-full">
                {sheetMode === "edit" ? (saving ? "Saving…" : "Save changes") : sheetMode === "activate" ? (activating === configPlugin?.id ? "Activating…" : "Activate") : (installing === configPlugin?.id ? "Installing…" : "Install")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
