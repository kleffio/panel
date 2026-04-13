"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Switch } from "@kleffio/ui";
import { ChevronDown } from "lucide-react";

type ConfigField = {
  key: string;
  label: string;
  description?: string;
  type: string;
  required: boolean;
  default?: string;
  options?: string[];
  advanced?: boolean;
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
  dependencies?: string[];
};

// The step the user is on:
//   "pick"     — top-level choice (connect existing vs bundled)
//   "existing" — OIDC form for their own IDP
//   "bundled"  — config form for a selected bundled plugin
type Step = "pick" | "existing" | "bundled";

// Fallback config fields for the "connect existing IDP" path,
// used when the idp-oidc plugin isn't (yet) returned by the catalog.
const OIDC_FALLBACK_FIELDS: ConfigField[] = [
  { key: "OIDC_ISSUER", label: "Issuer URL", type: "url", required: true,
    description: "Your identity provider's OIDC issuer URL (e.g. https://auth.example.com/application/o/kleff/)." },
  { key: "OIDC_CLIENT_ID", label: "Client ID", type: "string", required: true,
    description: "The client ID of your OIDC application." },
  { key: "OIDC_CLIENT_SECRET", label: "Client Secret", type: "secret", required: false,
    advanced: true,
    description: "The client secret. Leave blank for public clients." },
  { key: "AUTH_MODE", label: "Login Mode", type: "select", required: false, default: "headless",
    advanced: true,
    options: ["headless", "redirect"],
    description: "headless — Kleff shows its own login form (requires ROPC/Direct Access Grant). redirect — users are sent to your IDP's login page." },
];

export default function SetupPage() {
  const router = useRouter();
  const [bundledPlugins, setBundledPlugins] = useState<CatalogPlugin[]>([]);
  const [oidcPlugin, setOidcPlugin] = useState<CatalogPlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<CatalogPlugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/setup/catalog", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) {
          router.replace("/auth/login");
          return;
        }
        const data = await res.json();
        const idpPlugins: CatalogPlugin[] = (data.data?.plugins ?? []).filter(
          (p: CatalogPlugin) => p.type === "idp"
        );
        setOidcPlugin(idpPlugins.find((p) => p.id === "idp-oidc") ?? null);
        setBundledPlugins(idpPlugins.filter((p) => p.id !== "idp-oidc"));
      })
      .catch(() => setError("Failed to load plugin catalog."))
      .finally(() => setLoading(false));
  }, [router]);

  function startExisting() {
    // Use the catalog plugin if available, otherwise fall back to a hardcoded stub.
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
    const defaults: Record<string, string> = {};
    for (const field of plugin.config) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setInstallError(null);
    setStep("existing");
  }

  function selectBundled(plugin: CatalogPlugin) {
    setSelected(plugin);
    const defaults: Record<string, string> = {};
    for (const field of plugin.config) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setInstallError(null);
    setStep("bundled");
  }

  async function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setInstalling(true);
    setInstallError(null);

    try {
      // Install any required dependencies first
      if (selected.dependencies && selected.dependencies.length > 0) {
        for (const depId of selected.dependencies) {
          const depRes = await fetch("/api/v1/setup/install", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: depId,
              config: {},
            }),
          });
          if (!depRes.ok) {
            const data = await depRes.json().catch(() => ({}));
            throw new Error(data.error ?? `Failed to install dependency: ${depId}`);
          }
        }
      }

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
      // Clear any stale OIDC session so the login page doesn't auto-redirect
      // with the wrong identity (e.g. a previous IDP's token still in localStorage).
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("oidc.user:")) localStorage.removeItem(k);
      }
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
            {step === "existing" && "Enter your OIDC provider details. Kleff will fetch the rest from the discovery document."}
            {step === "bundled" && `Kleff will start a ${selected?.name} container automatically.`}
          </p>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {/* Step: pick */}
        {step === "pick" && (
          <div className="space-y-4">
            {/* Existing IDP option — primary */}
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={startExisting}
            >
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  I already have an identity provider
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect Authentik, Ory, Okta, Auth0, Azure AD, or any other OIDC-compatible provider.
                  You'll need an issuer URL and client credentials.
                </p>
              </CardContent>
            </Card>

            {/* Bundled options */}
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
          <form onSubmit={handleInstall} className="glass-panel space-y-4 p-6">
            <ConfigForm
              fields={selected.config}
              values={configValues}
              onChange={(k, v) => setConfigValues((prev) => ({ ...prev, [k]: v }))}
            />
            {installError && <p className="text-sm text-red-400">{installError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setStep("pick"); setSelected(null); }}
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
          <form onSubmit={handleInstall} className="glass-panel space-y-4 p-6">
            {!selected.config.some((f) => f.required) && (
              <p className="text-sm text-muted-foreground text-center">
                No configuration required. Kleff will start {selected.name} automatically.
                {selected.config.length > 0 && " You can optionally connect an existing instance below."}
              </p>
            )}
            {selected.dependencies && selected.dependencies.length > 0 && (
              <div className="rounded-md border p-4 bg-muted/10 mb-4">
                <p className="text-sm font-medium mb-1">Required dependencies</p>
                <p className="text-xs text-muted-foreground mb-3">
                  The following plugins will be automatically installed and activated prior to {selected.name}.
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
              <ConfigForm
                fields={selected.config}
                values={configValues}
                onChange={(k, v) => setConfigValues((prev) => ({ ...prev, [k]: v }))}
              />
            )}
            {installError && <p className="text-sm text-red-400">{installError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setStep("pick"); setSelected(null); }}
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

function ConfigForm({
  fields,
  values,
  onChange,
}: {
  fields: ConfigField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const [advancedMode, setAdvancedMode] = useState(false);
  const normalFields = fields.filter(f => !f.advanced);
  const advancedFields = fields.filter(f => f.advanced);
  const hasAdvancedFields = advancedFields.length > 0;

  const renderField = (field: ConfigField) => (
    <div key={field.key} className="space-y-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {field.type === "select" && field.options ? (
        <Select
          value={values[field.key] ?? ""}
          onValueChange={(v) => onChange(field.key, v)}
        >
          <SelectTrigger id={field.key} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <Switch
          id={field.key}
          checked={values[field.key] === "true"}
          onCheckedChange={(c) => onChange(field.key, c ? "true" : "false")}
        />
      ) : (
        <Input
          id={field.key}
          type={field.type === "secret" ? "password" : "text"}
          required={field.required}
          placeholder={field.default}
          value={values[field.key] ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );

  return (
    <>
      {normalFields.map(renderField)}
      
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
              {advancedFields.map(renderField)}
            </div>
          )}
        </div>
      )}
    </>
  );
}


