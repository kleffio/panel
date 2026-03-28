"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type ConfigField = {
  key: string;
  label: string;
  description?: string;
  type: string;
  required: boolean;
  default?: string;
  options?: string[];
};

type CatalogPlugin = {
  id: string;
  name: string;
  type: string;
  description: string;
  author: string;
  version: string;
  verified: boolean;
  config: ConfigField[];
};

export default function SetupPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState<CatalogPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected plugin + config form state
  const [selected, setSelected] = useState<CatalogPlugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/setup/catalog")
      .then(async (res) => {
        if (res.status === 403) {
          // Setup already complete — redirect to login
          router.replace("/auth/login");
          return;
        }
        const data = await res.json();
        const idpPlugins = (data.data?.plugins ?? []).filter(
          (p: CatalogPlugin) => p.type === "idp"
        );
        setPlugins(idpPlugins);
      })
      .catch(() => setError("Failed to load plugin catalog."))
      .finally(() => setLoading(false));
  }, [router]);

  function selectPlugin(plugin: CatalogPlugin) {
    setSelected(plugin);
    setInstallError(null);
    // Pre-fill defaults
    const defaults: Record<string, string> = {};
    for (const field of plugin.config) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
  }

  async function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setInstalling(true);
    setInstallError(null);

    try {
      const res = await fetch("/api/v1/setup/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          version: selected.version,
          config: configValues,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Installation failed.");
      }
      // IDP installed and activated — redirect to login
      window.location.replace("/auth/login");
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Installation failed.");
      setInstalling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-48 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-lg p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Setup
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {selected ? "Configure Identity Provider" : "Choose an Identity Provider"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selected
              ? `Set up ${selected.name} to enable authentication.`
              : "Install an identity provider to get started."}
          </p>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {!selected && (
          <div className="space-y-3">
            {plugins.length === 0 && !error && (
              <p className="text-center text-sm text-muted-foreground">
                No identity provider plugins found in the catalog.
              </p>
            )}
            {plugins.map((plugin) => (
              <Card
                key={plugin.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => selectPlugin(plugin)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{plugin.name}</p>
                      {plugin.verified && <Badge variant="secondary">verified</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{plugin.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">v{plugin.version}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected && (
          <form onSubmit={handleInstall} className="glass-panel space-y-4 p-6">
            {selected.config.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                {field.type === "select" && field.options ? (
                  <select
                    id={field.key}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={configValues[field.key] ?? ""}
                    onChange={(e) =>
                      setConfigValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "secret" ? "password" : "text"}
                    required={field.required}
                    placeholder={field.default}
                    value={configValues[field.key] ?? ""}
                    onChange={(e) =>
                      setConfigValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  />
                )}
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}

            {installError && <p className="text-sm text-red-400">{installError}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelected(null)}
                disabled={installing}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={installing}>
                {installing ? "Installing..." : "Install & Activate"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
