"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, CheckCircle, ExternalLink, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@kleffio/ui";
import { getCatalog, getInstalledPlugins, installPlugin } from "@/lib/api/plugins";
import { useHasRole } from "@/features/auth";
import type { CatalogPlugin } from "@/lib/api/plugins";

const TYPE_LABELS: Record<string, string> = {
  ui: "UI",
  idp: "Identity Provider",
};

export default function MarketplacePage() {
  const isAdmin = useHasRole("admin");
  const [plugins, setPlugins] = useState<CatalogPlugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [filterOfficial, setFilterOfficial] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    getCatalog().then((r) => setPlugins(r.plugins ?? []));
    getInstalledPlugins().then((r) =>
      setInstalledIds(new Set((r.plugins ?? []).map((p) => p.id)))
    );
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

  async function handleInstall(id: string) {
    setInstalling(id);
    try {
      await installPlugin(id);
      setJustInstalled((s) => new Set(s).add(id));
      setInstalledIds((s) => new Set(s).add(id));
    } finally {
      setInstalling(null);
    }
  }

  function toggleFilter(
    current: boolean,
    set: (v: boolean) => void,
    value: boolean
  ) {
    set(current === value ? false : value);
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
              onClick={() =>
                setFilterCategory((prev) => (prev === cat ? "" : cat))
              }
            >
              {TYPE_LABELS[cat] ?? cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No plugins match your filters.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => {
          const isInstalled = installedIds.has(plugin.id);
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
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant={isInstalled ? "outline" : "default"}
                        disabled={installing === plugin.id || isInstalled}
                        onClick={() => handleInstall(plugin.id)}
                      >
                        {isInstalled
                          ? "Installed"
                          : installing === plugin.id
                          ? "Installing…"
                          : "Install"}
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
    </div>
  );
}
