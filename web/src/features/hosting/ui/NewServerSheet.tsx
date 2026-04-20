"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Server, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@kleffio/ui";
import { toast } from "sonner";
import { listCrates, listBlueprints } from "@/lib/api/catalog";
import { createDeployment } from "@/lib/api/deployments";
import { isApiError } from "@/lib/api/error";
import type { Crate, Blueprint, ConfigField } from "@/lib/api/catalog";
import { AnimatePresence, motion } from "framer-motion";

type Step = "crate" | "blueprint" | "config";

interface MojangVersion {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
}

interface NewServerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectID: string | null;
  onCreated?: (deploymentId: string) => void;
  activeServerNames?: string[];
}

const MEMORY_OPTIONS: { label: string; mb: number }[] = [
  { label: "2 GB", mb: 2048 },
  { label: "4 GB", mb: 4096 },
  { label: "8 GB", mb: 8192 },
  { label: "16 GB", mb: 16384 },
];

const CPU_OPTIONS: { label: string; millicores: number }[] = [
  { label: "1 vCPU", millicores: 1000 },
  { label: "2 vCPU", millicores: 2000 },
  { label: "4 vCPU", millicores: 4000 },
  { label: "8 vCPU", millicores: 8000 },
];

function nearestMemoryOption(mb: number): number {
  const exact = MEMORY_OPTIONS.find((o) => o.mb === mb);
  if (exact) return exact.mb;
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

function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    const payload = err.data as { error?: string } | null;
    if (payload?.error) return payload.error;
    if (err.message) return err.message;
    return "Failed to create server";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Failed to create server";
}

async function fetchMojangVersions(): Promise<MojangVersion[]> {
  const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  const data = await res.json();
  return (data.versions ?? []) as MojangVersion[];
}

function resolveLatestReleaseVersion(versions: MojangVersion[]): string | null {
  if (versions.length === 0) return null;
  return versions.find((v) => v.type === "release")?.id ?? versions[0]?.id ?? null;
}

// Dark styled input for the modal
function DarkInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  id?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-12 w-full rounded-full border-input bg-background/85 px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/20"
    />
  );
}

function DarkLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="mb-2 block text-sm text-foreground/90">
      {children}
    </Label>
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
  if (mojangVersions && mojangVersions.length > 0) {
    const filtered = showSnapshots
      ? mojangVersions
      : mojangVersions.filter((v) => v.type === "release");

    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <DarkLabel htmlFor={field.key}>{field.label}</DarkLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleSnapshots}
            className="h-6 px-2 text-[11px] text-white/50 hover:bg-white/8 hover:text-white/80"
          >
            {showSnapshots ? "Hide snapshots" : "Show snapshots"}
          </Button>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key} className="h-12 rounded-full border-input bg-background/85 px-4 text-foreground">
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
    <div>
      <DarkLabel htmlFor={field.key}>
        {field.label}{field.required && <span className="ml-0.5 text-red-400">*</span>}
      </DarkLabel>
      {field.description && (
        <p className="mb-1.5 text-xs text-muted-foreground">{field.description}</p>
      )}
      {field.type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key} className="h-12 rounded-full border-input bg-background/85 px-4 text-foreground">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <DarkInput
          id={field.key}
          type={field.type === "secret" ? "password" : field.type === "number" ? "number" : "text"}
          value={value}
          onChange={onChange}
          required={field.required}
        />
      )}
    </div>
  );
}

export function NewServerSheet({ open, onOpenChange, projectID, onCreated, activeServerNames = [] }: NewServerSheetProps) {
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
  const [mojangVersions, setMojangVersions] = useState<MojangVersion[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedServerName = serverName.trim().toLowerCase();
  const nameConflict = normalizedServerName !== "" && activeServerNames.some((name) => name.trim().toLowerCase() === normalizedServerName);
  const nameInvalid = serverName.trim() !== "" && !/^[a-zA-Z0-9][a-zA-Z0-9_.\-]*$/.test(serverName.trim());
  const requiredFieldsFilled = selectedBlueprint
    ? selectedBlueprint.config.filter((f) => f.required).every((f) => (configValues[f.key] ?? "").trim() !== "")
    : true;

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
    const defaults = buildDefaults(bp.config);
    if (bp.constructs && Object.keys(bp.constructs).length > 0) {
      defaults["IMAGE"] = Object.keys(bp.constructs)[0];
    }
    setConfigValues(defaults);
    setMemoryMB(nearestMemoryOption(bp.resources.memory_mb));
    setCpuMillicores(nearestCPUOption(bp.resources.cpu_millicores));
    setStep("config");
    if (selectedCrate?.id === "minecraft" && bp.config.some((field) => field.key === "VERSION")) {
      fetchMojangVersions()
        .then((versions) => {
          setMojangVersions(versions);
          const latestVersion = resolveLatestReleaseVersion(versions);
          if (!latestVersion) return;
          setConfigValues((prev) => {
            if (prev.VERSION === undefined || prev.VERSION === latestVersion) return prev;
            return { ...prev, VERSION: latestVersion };
          });
        })
        .catch(() => {});
    }
  }

  function setField(key: string, value: string) {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBlueprint || !serverName.trim() || !projectID) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createDeployment(projectID, {
        blueprint_id: selectedBlueprint.id,
        server_name: serverName.trim(),
        config: configValues,
        resources: { memory_mb: memoryMB, cpu_millicores: cpuMillicores },
      });
      toast.success("Server is being provisioned");
      onOpenChange(false);
      onCreated?.(result.deployment_id);
    } catch (err) {
      const message = extractErrorMessage(err);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (step === "config") setStep("blueprint");
    else if (step === "blueprint") setStep("crate");
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-xl"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="glass-panel relative flex w-full max-w-[500px] flex-col overflow-hidden rounded-[1.85rem] border border-[var(--test-border)] text-[var(--test-foreground)] shadow-[0_30px_80px_rgba(0,0,0,0.58)]"
            style={{ maxHeight: "min(640px, 90vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,181,23,0.1),transparent_56%),linear-gradient(180deg,rgba(6,6,7,0.92),rgba(8,8,9,0.97))]" />

            {/* Close */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 z-20 text-muted-foreground hover:bg-white/10 hover:text-[var(--test-foreground)]"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Back + title */}
            <div className="relative z-10 flex items-center gap-2 border-b border-[var(--test-border)] px-5 py-4 pr-12">
              {step !== "crate" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={goBack}
                  className="mr-1 text-muted-foreground hover:bg-white/10 hover:text-[var(--test-foreground)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <p className="text-base font-semibold text-[var(--test-foreground)]">
                  {step === "crate" ? "Add a server" : step === "blueprint" ? `${selectedCrate?.name ?? "Server"} types` : `Configure server`}
                </p>
                <p className="text-[11px] text-[var(--test-muted)]">
                  {step === "crate" ? "Select a game to host" : step === "blueprint" ? "Pick a server variant" : `Setting up ${selectedBlueprint?.name}`}
                </p>
              </div>
            </div>

            {/* Step 1: Crate list */}
            {step === "crate" && (
              <div className="kleff-scrollbar relative z-10 flex-1 overflow-y-auto pr-1.5">
                {loadingCrates ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading games...</div>
                ) : crates.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No games available.</div>
                ) : (
                  crates.map((crate) => (
                    <button
                      key={crate.id}
                      type="button"
                      onClick={() => selectCrate(crate)}
                      className="group flex w-full items-center gap-3 border-b border-[var(--test-border)] px-5 py-3.5 text-left last:border-0 transition-colors hover:bg-white/[0.035]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-black/20 transition-colors group-hover:border-[#f5b517]/35 group-hover:bg-[#f5b517]/10">
                        {crate.logo ? (
                          <img src={crate.logo} alt={crate.name} className="h-5 w-5 object-contain" />
                        ) : (
                          <Server className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#f5b517]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--test-foreground)]">{crate.name}</p>
                        {crate.description && (
                          <p className="mt-0.5 truncate text-[11px] text-[var(--test-muted)]">{crate.description}</p>
                        )}
                      </div>
                      <ChevronLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground/80" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Blueprint list */}
            {step === "blueprint" && (
              <div className="kleff-scrollbar relative z-10 flex-1 overflow-y-auto pr-1.5">
                {loadingBlueprints ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading server types...</div>
                ) : blueprints.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No server types available.</div>
                ) : (
                  blueprints.map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => selectBlueprint(bp)}
                      className="group flex w-full items-center gap-3 border-b border-[var(--test-border)] px-5 py-3.5 text-left last:border-0 transition-colors hover:bg-white/[0.035]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-black/20 transition-colors group-hover:border-[#f5b517]/35 group-hover:bg-[#f5b517]/10">
                        <Server className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#f5b517]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--test-foreground)]">{bp.name}</p>
                        {bp.description && (
                          <p className="mt-0.5 truncate text-[11px] text-[var(--test-muted)]">{bp.description}</p>
                        )}
                      </div>
                      <ChevronLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground/80" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 3: Config form */}
            {step === "config" && selectedBlueprint && (
              <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 min-h-0">
                <div className="kleff-scrollbar flex-1 overflow-y-auto px-5 py-5 pr-3">
                  <div className="space-y-5">
                    {/* Server name */}
                    <div>
                    <DarkLabel htmlFor="server-name">Server name <span className="text-red-400">*</span></DarkLabel>
                    <DarkInput
                      id="server-name"
                      value={serverName}
                      onChange={setServerName}
                      placeholder="my-server"
                      required
                    />
                    </div>

                    {/* Construct selector (runtime/image picker) */}
                    {selectedBlueprint.constructs && Object.keys(selectedBlueprint.constructs).length > 1 && (
                      <div>
                        <DarkLabel htmlFor="construct-select">Runtime</DarkLabel>
                        <Select
                          value={configValues["IMAGE"] ?? ""}
                          onValueChange={(v) => setField("IMAGE", v)}
                        >
                          <SelectTrigger id="construct-select" className="h-12 rounded-full border-input bg-background/85 px-4 text-foreground">
                            <SelectValue placeholder="Select runtime…" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(selectedBlueprint.constructs).map((label) => (
                              <SelectItem key={label} value={label}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Blueprint config fields */}
                    <div className="space-y-4">
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
                    </div>

                    {/* Resources */}
                    <div className="space-y-4 border-t border-border/70 pt-4">
                      <p className="text-xs font-medium text-muted-foreground">Resources</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <DarkLabel htmlFor="memory">Memory</DarkLabel>
                          <Select value={String(memoryMB)} onValueChange={(v) => setMemoryMB(Number(v))}>
                            <SelectTrigger id="memory" className="h-12 rounded-full border-input bg-background/85 px-4 text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMORY_OPTIONS.map((o) => (
                                <SelectItem key={o.mb} value={String(o.mb)}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <DarkLabel htmlFor="cpu">CPU</DarkLabel>
                          <Select value={String(cpuMillicores)} onValueChange={(v) => setCpuMillicores(Number(v))}>
                            <SelectTrigger id="cpu" className="h-12 rounded-full border-input bg-background/85 px-4 text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CPU_OPTIONS.map((o) => (
                                <SelectItem key={o.millicores} value={String(o.millicores)}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Errors */}
                    {nameInvalid && <p className="text-xs text-red-400">Name can only contain letters, numbers, underscores, dots, and hyphens.</p>}
                    {nameConflict && <p className="text-xs text-red-400">A server with that name already exists.</p>}
                    {submitError && <p className="text-xs text-red-400">{submitError}</p>}
                    {!projectID && <p className="text-xs text-red-400">Select a project before launching a server.</p>}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--test-border)] px-5 py-4">
                  <Button
                    type="submit"
                    disabled={submitting || !projectID || !serverName.trim() || nameConflict || nameInvalid || !requiredFieldsFilled}
                    className="h-12 w-full rounded-full bg-gradient-kleff text-primary-foreground text-sm font-semibold shadow-[0_18px_40px_rgba(196,143,0,0.22)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "Launching…" : "Launch server"}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
