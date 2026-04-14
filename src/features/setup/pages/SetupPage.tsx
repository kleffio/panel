"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, Skeleton } from "@kleffio/ui";
import { useSetupCatalog } from "@/features/setup/hooks/useSetupCatalog";
import { useSetupInstall } from "@/features/setup/hooks/useSetupInstall";
import { ConfigForm } from "@/features/setup/ui/ConfigForm";
import { OIDC_FALLBACK_FIELDS } from "@/features/setup/model/types";
import type { CatalogPlugin, Step } from "@/features/setup/model/types";

export function SetupPage() {
  const { bundledPlugins, oidcPlugin, loading, error } = useSetupCatalog();
  const { configValues, installing, installError, initConfig, setField, handleInstall } =
    useSetupInstall();

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<CatalogPlugin | null>(null);

  function startExisting() {
    const plugin = oidcPlugin ?? {
      id: "idp-oidc",
      name: "Generic OIDC",
      type: "idp",
      description: "",
      author: "Kleff",
      version: "1.0.0",
      verified: true,
      config: OIDC_FALLBACK_FIELDS,
    };
    setSelected(plugin);
    initConfig(plugin);
    setStep("existing");
  }

  function selectBundled(plugin: CatalogPlugin) {
    setSelected(plugin);
    initConfig(plugin);
    setStep("bundled");
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

        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Setup
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {step === "pick" && "Set up authentication"}
            {step === "existing" && "Connect your identity provider"}
            {step === "bundled" && `Configure ${selected?.name}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "pick" && "Choose how users will log in to your Kleff instance."}
            {step === "existing" &&
              "Enter your OIDC provider details. Kleff will fetch the rest from the discovery document."}
            {step === "bundled" &&
              `Kleff will start a ${selected?.name} container automatically.`}
          </p>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {/* Step: pick */}
        {step === "pick" && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={startExisting}
            >
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  I already have an identity provider
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect Authentik, Ory, Okta, Auth0, Azure AD, or any other OIDC-compatible
                  provider. You'll need an issuer URL and client credentials.
                </p>
              </CardContent>
            </Card>

            {bundledPlugins.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">or set up a new one</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                <div className="space-y-2">
                  {bundledPlugins.map((plugin) => (
                    <Card
                      key={plugin.id}
                      className="cursor-pointer transition-colors hover:border-primary/50"
                      onClick={() => selectBundled(plugin)}
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
              </>
            )}
          </div>
        )}

        {/* Step: existing IDP form (idp-oidc) */}
        {step === "existing" && selected && (
          <form
            onSubmit={(e) => handleInstall(e, selected)}
            className="glass-panel space-y-4 p-6"
          >
            <ConfigForm fields={selected.config} values={configValues} onChange={setField} />
            {installError && <p className="text-sm text-red-400">{installError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep("pick");
                  setSelected(null);
                }}
                disabled={installing}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={installing}>
                {installing ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </form>
        )}

        {/* Step: bundled plugin config form */}
        {step === "bundled" && selected && (
          <form
            onSubmit={(e) => handleInstall(e, selected)}
            className="glass-panel space-y-4 p-6"
          >
            {!selected.config.some((f) => f.required) && (
              <p className="text-sm text-muted-foreground text-center">
                No configuration required. Kleff will start {selected.name} automatically.
                {selected.config.length > 0 &&
                  " You can optionally connect an existing instance below."}
              </p>
            )}
            {selected.dependencies && selected.dependencies.length > 0 && (
              <div className="rounded-md border p-4 bg-muted/10 mb-4">
                <p className="text-sm font-medium mb-1">Required dependencies</p>
                <p className="text-xs text-muted-foreground mb-3">
                  The following plugins will be automatically installed and activated prior to{" "}
                  {selected.name}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.dependencies.map((dep) => (
                    <Badge key={dep} variant="secondary" className="px-2 py-0 border-primary/20">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selected.config.length > 0 && (
              <ConfigForm fields={selected.config} values={configValues} onChange={setField} />
            )}
            {installError && <p className="text-sm text-red-400">{installError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep("pick");
                  setSelected(null);
                }}
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
