"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Server } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Button, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@kleffio/ui";
import { toast } from "sonner";
import { listCrates, listBlueprints } from "@/lib/api/catalog";
import { createDeployment } from "@/lib/api/deployments";
import type { Crate, Blueprint, ConfigField } from "@/lib/api/catalog";

type Step = "crate" | "blueprint" | "config";

interface MojangVersion {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
}

interface NewServerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (deploymentId: string) => void;
  activeServerNames?: string[];
}

// Memory options: label → mb value
const MEMORY_OPTIONS: { label: string; mb: number }[] = [
  { label: "2 GB", mb: 2048 },
  { label: "4 GB", mb: 4096 },
  { label: "8 GB", mb: 8192 },
  { label: "16 GB", mb: 16384 },
];

// CPU options: label → millicores value
const CPU_OPTIONS: { label: string; millicores: number }[] = [
  { label: "1 vCPU", millicores: 1000 },
  { label: "2 vCPU", millicores: 2000 },
  { label: "4 vCPU", millicores: 4000 },
  { label: "8 vCPU", millicores: 8000 },
];

function nearestMemoryOption(mb: number): number {
  const exact = MEMORY_OPTIONS.find((o) => o.mb === mb);
  if (exact) return exact.mb;
  // pick closest
  return MEMORY_OPTIONS.reduce((prev, cur) =>
    Math.abs(cur.mb - mb) < Math.abs(prev.mb - mb) ? cur : prev
  ).mb;
}

function nearestCPUOption(millicores: number): number {
  const exact = CPU_OPTIONS.find((o) => o.millicores === millicores);
  if (exact) return exact.millicores;
  return CPU_OPTIONS.reduce((prev, cur) =>
    Math.abs(cur.millicores - millicores) < Math.abs(prev.millicores - millicores) ? cur : prev
  ).millicores;
}

function generateSecret(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildDefaults(fields: ConfigField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.auto_generate && f.auto_generate_length) {
      values[f.key] = generateSecret(f.auto_generate_length);
    } else if (f.default !== undefined && f.default !== null) {
      values[f.key] = String(f.default);
    } else {
      values[f.key] = "";
    }
  }
  return values;
}

async function fetchMojangVersions(): Promise<MojangVersion[]> {
  const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  const data = await res.json();
  return (data.versions ?? []) as MojangVersion[];
}

export function NewServerSheet({ open, onOpenChange, onCreated, activeServerNames = [] }: NewServerSheetProps) {
  const [step, setStep] = useState<Step>("crate");

  const [crates, setCrates] = useState<Crate[]>([]);
  const [loadingCrates, setLoadingCrates] = useState(false);

  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loadingBlueprints, setLoadingBlueprints] = useState(false);

  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);

  const [serverName, setServerName] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [memoryMB, setMemoryMB] = useState(2048);
  const [cpuMillicores, setCpuMillicores] = useState(1000);

  // Mojang versions — only fetched for minecraft crates
  const [mojangVersions, setMojangVersions] = useState<MojangVersion[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameConflict = activeServerNames.includes(serverName.trim());

  const requiredFieldsFilled = selectedBlueprint
    ? selectedBlueprint.config
        .filter((f) => f.required)
        .every((f) => (configValues[f.key] ?? "").trim() !== "")
    : true;

  // Reset wizard when sheet closes
  useEffect(() => {
    if (!open) {
      setStep("crate");
      setSelectedCrate(null);
      setSelectedBlueprint(null);
      setBlueprints([]);
      setServerName("");
      setConfigValues({});
      setMemoryMB(2048);
      setCpuMillicores(1000);
      setMojangVersions([]);
      setShowSnapshots(false);
      setSubmitError(null);
    }
  }, [open]);

  // Load crates when sheet opens
  useEffect(() => {
    if (!open) return;
    setLoadingCrates(true);
    listCrates()
      .then((res) => setCrates(res.crates ?? []))
      .catch(() => toast.error("Failed to load games"))
      .finally(() => setLoadingCrates(false));
  }, [open]);

  function selectCrate(crate: Crate) {
    setSelectedCrate(crate);
    setLoadingBlueprints(true);
    setBlueprints([]);
    setStep("blueprint");
    listBlueprints(crate.id)
      .then((res) => setBlueprints(res.blueprints ?? []))
      .catch(() => toast.error("Failed to load server types"))
      .finally(() => setLoadingBlueprints(false));
  }

  function selectBlueprint(bp: Blueprint) {
    setSelectedBlueprint(bp);
    setConfigValues(buildDefaults(bp.config));
    setMemoryMB(nearestMemoryOption(bp.resources.memory_mb));
    setCpuMillicores(nearestCPUOption(bp.resources.cpu_millicores));
    setStep("config");

    // Fetch Mojang versions for minecraft crates
    if (selectedCrate?.id === "minecraft") {
      fetchMojangVersions()
        .then(setMojangVersions)
        .catch(() => { /* silently fall back to blueprint options */ });
    }
  }

  function setField(key: string, value: string) {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBlueprint || !serverName.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createDeployment({
        blueprint_id: selectedBlueprint.id,
        server_name: serverName.trim(),
        config: configValues,
        resources: { memory_mb: memoryMB, cpu_millicores: cpuMillicores },
      });
      toast.success("Server is being provisioned");
      onOpenChange(false);
      onCreated?.(result.deployment_id);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to create server";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitle: Record<Step, string> = {
    crate: "Choose a game",
    blueprint: "Choose a server type",
    config: "Configure your server",
  };

  const stepDesc: Record<Step, string> = {
    crate: "Pick the game you want to host.",
    blueprint: `Select a server type for ${selectedCrate?.name ?? "this game"}.`,
    config: `Set up your ${selectedBlueprint?.name ?? "server"} server.`,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {step !== "crate" && (
              <button
                type="button"
                onClick={() => setStep(step === "config" ? "blueprint" : "crate")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <SheetTitle>{stepTitle[step]}</SheetTitle>
          </div>
          <SheetDescription>{stepDesc[step]}</SheetDescription>
        </SheetHeader>

        {/* ── Step 1: Crate picker ───────────────────────────────────────── */}
        {step === "crate" && (
          <div className="px-4 py-4 space-y-3">
            {loadingCrates ? (
              <p className="text-sm text-muted-foreground">Loading games…</p>
            ) : crates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No games available.</p>
            ) : (
              crates.map((crate) => (
                <button
                  key={crate.id}
                  type="button"
                  onClick={() => selectCrate(crate)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors p-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    {crate.logo ? (
                      <img src={crate.logo} alt={crate.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <Server className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{crate.name}</p>
                    {crate.description && (
                      <p className="text-xs text-muted-foreground truncate">{crate.description}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Step 2: Blueprint picker ───────────────────────────────────── */}
        {step === "blueprint" && (
          <div className="px-4 py-4 space-y-3">
            {loadingBlueprints ? (
              <p className="text-sm text-muted-foreground">Loading server types…</p>
            ) : blueprints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No server types available.</p>
            ) : (
              blueprints.map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => selectBlueprint(bp)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors p-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Server className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{bp.name}</p>
                    {bp.description && (
                      <p className="text-xs text-muted-foreground truncate">{bp.description}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Step 3: Config form ────────────────────────────────────────── */}
        {step === "config" && selectedBlueprint && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
            {/* Server name */}
            <div className="space-y-1.5">
              <Label htmlFor="server-name">Server name</Label>
              <Input
                id="server-name"
                placeholder="my-minecraft-server"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
              />
            </div>

            {/* Blueprint config fields */}
            {selectedBlueprint.config.map((field) => (
              <ConfigFieldInput
                key={field.key}
                field={field}
                value={configValues[field.key] ?? ""}
                onChange={(v) => setField(field.key, v)}
                mojangVersions={field.key === "VERSION" && selectedCrate?.id === "minecraft" ? mojangVersions : undefined}
                showSnapshots={showSnapshots}
                onToggleSnapshots={() => setShowSnapshots((v) => !v)}
              />
            ))}

            {/* ── Resources ─────────────────────────────────────────────── */}
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-sm font-medium text-foreground pt-2">Resources</p>

              <div className="space-y-1.5">
                <Label htmlFor="memory">Memory</Label>
                <Select value={String(memoryMB)} onValueChange={(v) => setMemoryMB(Number(v))}>
                  <SelectTrigger id="memory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_OPTIONS.map((o) => (
                      <SelectItem key={o.mb} value={String(o.mb)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpu">CPU</Label>
                <Select value={String(cpuMillicores)} onValueChange={(v) => setCpuMillicores(Number(v))}>
                  <SelectTrigger id="cpu">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CPU_OPTIONS.map((o) => (
                      <SelectItem key={o.millicores} value={String(o.millicores)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {nameConflict && (
              <p className="text-sm text-destructive">A server with that name already exists.</p>
            )}
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <SheetFooter className="px-0 pt-2">
              <Button type="submit" disabled={submitting || !serverName.trim() || nameConflict || !requiredFieldsFilled} className="w-full">
                {submitting ? "Launching…" : "Launch server"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConfigFieldInput({
  field,
  value,
  onChange,
  mojangVersions,
  showSnapshots,
  onToggleSnapshots,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  mojangVersions?: MojangVersion[];
  showSnapshots?: boolean;
  onToggleSnapshots?: () => void;
}) {
  // Use Mojang versions when available for the VERSION field
  if (mojangVersions && mojangVersions.length > 0) {
    const filtered = showSnapshots
      ? mojangVersions
      : mojangVersions.filter((v) => v.type === "release");

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.key}>{field.label}</Label>
          <button
            type="button"
            onClick={onToggleSnapshots}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSnapshots ? "Hide snapshots" : "Show snapshots"}
          </button>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key}>
            <SelectValue placeholder="Select version…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {filtered.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.id}
                {v.type === "snapshot" && (
                  <span className="ml-1.5 text-xs text-muted-foreground">snapshot</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {field.type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "secret" ? (
        <Input
          id={field.key}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      ) : field.type === "number" ? (
        <Input
          id={field.key}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      ) : (
        <Input
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )}
    </div>
  );
}
