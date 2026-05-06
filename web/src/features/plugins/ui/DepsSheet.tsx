"use client";

import { useMemo, useState } from "react";
import { Check, Package } from "lucide-react";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kleffio/ui";
import { Spinner } from "@/components/ui/Spinner";
import { installPlugin } from "@/lib/api/plugins";
import type { CatalogPlugin } from "@/lib/api/plugins";

interface DepsSheetProps {
  plugin: CatalogPlugin | null;
  catalog: CatalogPlugin[];
  installedIds: Set<string>;
  onDepInstalled: (id: string) => void;
  onClose: () => void;
  onContinue: () => void;
}

export function DepsSheet({
  plugin,
  catalog,
  installedIds,
  onDepInstalled,
  onClose,
  onContinue,
}: DepsSheetProps) {
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
        const msg =
          (err?.data as any)?.error ?? err?.message ?? "Install failed.";
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
            <strong>{plugin?.name}</strong> requires the following plugins to be
            installed first.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 py-4">
          {deps.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    dep.installed ? "bg-emerald-500/10" : "bg-muted"
                  }`}
                >
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
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs text-emerald-600 border-emerald-400/50"
                >
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
                    <Spinner size="xs" />
                  ) : (
                    "Install"
                  )}
                </Button>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}
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
                  <Spinner size="xs" className="mr-1.5" />
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
            onClick={() => {
              onClose();
              onContinue();
            }}
          >
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
