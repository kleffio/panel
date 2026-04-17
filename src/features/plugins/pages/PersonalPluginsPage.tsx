"use client";

import { ExternalLink, Package, Search, User } from "lucide-react";
import { Badge, Button, Input } from "@kleffio/ui";
import { useMarketplace } from "@/features/plugins/hooks/useMarketplace";
import { PLUGIN_TIER } from "@/features/plugins/model/types";

export function PersonalPluginsPage() {
  const {
    plugins,
    installedIds,
    installing,
    uninstalling,
    actionError,
    search,
    setSearch,
    filterInstalled,
    setFilterInstalled,
    withDepsCheck,
    openSheet,
    handleUninstall,
  } = useMarketplace();

  const personalPlugins = plugins.filter((p) => {
    const tier = PLUGIN_TIER[p.type] ?? "project";
    const q = search.trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filterInstalled && !installedIds.has(p.id)) return false;
    return tier === "user";
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Personal Plugins</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plugins that only affect your own experience — no admin approval needed.
        </p>
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

      {personalPlugins.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-card/40 px-6 py-12 text-center">
          <User className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || filterInstalled ? "No plugins match your filters." : "No personal plugins available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {personalPlugins.map((plugin) => {
            const isInstalled = installedIds.has(plugin.id);
            return (
              <div key={plugin.id} className="flex flex-col rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{plugin.name}</p>
                        <p className="text-[10px] text-muted-foreground">by {plugin.author}</p>
                      </div>
                    </div>
                    {isInstalled && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">Installed</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{plugin.description}</p>
                  {plugin.tags && plugin.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plugin.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-border px-5 py-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">v{plugin.version}</span>
                  <div className="flex items-center gap-2">
                    {isInstalled ? (
                      <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={uninstalling === plugin.id} onClick={() => handleUninstall(plugin.id)}>
                        {uninstalling === plugin.id ? "Removing…" : "Uninstall"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="default" className="h-7 text-xs" disabled={installing === plugin.id} onClick={() => withDepsCheck(plugin, () => openSheet(plugin, "install"))}>
                        {installing === plugin.id ? "Installing…" : "Install"}
                      </Button>
                    )}
                    {plugin.verified && (
                      <a href="https://github.com/kleffio/plugins" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
