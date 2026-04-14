"use client";

import { Check, CheckCircle, ChevronDown, ExternalLink, Package, Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { TYPE_LABELS } from "@/features/plugins/model/types";

export function MarketplacePage() {
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
    filterOfficial,
    setFilterOfficial,
    filterCategory,
    setFilterCategory,
    categories,
    filtered,
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
                    {plugin.verified && <CheckCircle className="size-3.5 text-emerald-400" />}
                    {isActiveIDP && (
                      <Badge
                        variant="default"
                        className="text-xs bg-emerald-600 hover:bg-emerald-600"
                      >
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
                          title={
                            depInstalled
                              ? `Requires ${depPlugin?.name ?? dep} (installed)`
                              : `Requires ${depPlugin?.name ?? dep} (not installed)`
                          }
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
                        className={
                          isActiveIDP
                            ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                            : ""
                        }
                        disabled={uninstalling === plugin.id || isActiveIDP}
                        title={
                          isActiveIDP
                            ? "Switch to another identity provider before uninstalling"
                            : undefined
                        }
                        onClick={() => handleUninstall(plugin.id)}
                      >
                        {uninstalling === plugin.id ? "Removing…" : "Uninstall"}
                      </Button>
                    )}
                    {isAdmin && isInstalled && (plugin.config ?? []).length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => prefillEdit(plugin)}>
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
                        {installing === plugin.id
                          ? "Installing…"
                          : depsBlocked
                          ? "Install…"
                          : "Install"}
                      </Button>
                    )}
                    {plugin.verified && (
                      <a
                        href="https://github.com/kleffio/plugins"
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
        onClose={() => {
          setDepsPlugin(null);
          setPendingAction(null);
        }}
        onContinue={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />

      {/* Config sheet */}
      <Sheet
        open={!!configPlugin}
        onOpenChange={(open) => {
          if (!open) setConfigPlugin(null);
        }}
      >
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
                onChange={(v) => setConfigValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}

            {hasAdvancedFields && (
              <div className="space-y-4 pt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                  onClick={() => setAdvancedMode((v) => !v)}
                >
                  <ChevronDown
                    className={`size-3.5 transition-transform ${
                      advancedMode ? "rotate-180" : ""
                    }`}
                  />
                  {advancedMode ? "Hide advanced settings" : "Show advanced settings"}
                </button>

                {advancedMode && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {advancedFields.map((field) => (
                      <ConfigFieldInput
                        key={field.key}
                        field={field}
                        value={configValues[field.key] ?? ""}
                        onChange={(v) =>
                          setConfigValues((prev) => ({ ...prev, [field.key]: v }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {configError && <p className="text-sm text-destructive">{configError}</p>}

            <SheetFooter className="px-0 pt-2">
              <Button
                type="submit"
                disabled={
                  activating === configPlugin?.id ||
                  installing === configPlugin?.id ||
                  saving
                }
                className="w-full"
              >
                {sheetMode === "edit"
                  ? saving
                    ? "Saving…"
                    : "Save changes"
                  : sheetMode === "activate"
                  ? activating === configPlugin?.id
                    ? "Activating…"
                    : "Activate"
                  : installing === configPlugin?.id
                  ? "Installing…"
                  : "Install"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
