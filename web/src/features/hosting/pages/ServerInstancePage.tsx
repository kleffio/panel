"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Circle,
  Database,
  FileText,
  Globe,
  HardDrive,
  LayoutDashboard,
  RotateCcw,
  Server,
  Shield,
  Swords,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@kleffio/ui";

import { getWorkload, deleteWorkload, type WorkloadDTO } from "@/lib/api/projects";
import { getStatusMeta, getKindMeta } from "@/features/hosting/lib/infrastructure-graph";
import { LogViewer } from "@/features/hosting/ui/LogViewer";
import { WorkloadMetricsTab } from "@/features/hosting/ui/MetricWidgets";
import type { NodeKind, NodeStatus } from "@/features/hosting/model/types";

// ── Kind inference (mirrors ProjectArchitecturePage) ──────────────────────────

function inferNodeKind(image: string, blueprintID: string): NodeKind {
  const descriptor = `${image} ${blueprintID}`.toLowerCase();
  if (
    descriptor.includes("postgres") ||
    descriptor.includes("mysql") ||
    descriptor.includes("mariadb") ||
    descriptor.includes("mongo")
  ) {
    return "database";
  }
  if (
    descriptor.includes("redis") ||
    descriptor.includes("cache") ||
    descriptor.includes("memcached")
  ) {
    return "cache";
  }
  if (
    descriptor.includes("proxy") ||
    descriptor.includes("traefik") ||
    descriptor.includes("envoy") ||
    descriptor.includes("nginx")
  ) {
    return "proxy";
  }
  if (
    descriptor.includes("worker") ||
    descriptor.includes("queue") ||
    descriptor.includes("jobs")
  ) {
    return "worker";
  }
  if (descriptor.includes("minecraft") || descriptor.includes("game")) {
    return "game-server";
  }
  if (
    descriptor.includes("web") ||
    descriptor.includes("frontend") ||
    descriptor.includes("next")
  ) {
    return "app";
  }
  return "api";
}

function mapStateToStatus(
  state: WorkloadDTO["state"],
  isDeleting: boolean,
): NodeStatus {
  if (isDeleting) return "deleting";
  switch (state) {
    case "running":
      return "running";
    case "pending":
      return "starting";
    default:
      return "error";
  }
}

// ── Kind icon ─────────────────────────────────────────────────────────────────

const KIND_ICONS: Record<NodeKind, React.ElementType> = {
  app: Globe,
  api: Server,
  worker: Boxes,
  database: Database,
  cache: HardDrive,
  proxy: Shield,
  "game-server": Swords,
  support: Activity,
};

// ── Nav sections by kind ──────────────────────────────────────────────────────

type Section = "overview" | "logs" | "metrics" | "console" | "mods" | "plugins" | "datapacks";

function getSections(kind: NodeKind): Section[] {
  const base: Section[] = ["overview", "logs", "metrics"];
  if (kind === "game-server") {
    return [...base, "console", "mods", "plugins", "datapacks"];
  }
  return base;
}

const SECTION_LABELS: Record<Section, string> = {
  overview: "Overview",
  logs: "Logs",
  metrics: "Metrics",
  console: "Console",
  mods: "Mods",
  plugins: "Plugins",
  datapacks: "Datapacks",
};

const SECTION_ICONS: Record<Section, React.ElementType> = {
  overview: LayoutDashboard,
  logs: FileText,
  metrics: Activity,
  console: Terminal,
  mods: Boxes,
  plugins: Swords,
  datapacks: HardDrive,
};

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === "running")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "error")
    return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (status === "deleting")
    return <XCircle className="h-3.5 w-3.5 text-red-300/70" />;
  return <Circle className="h-3.5 w-3.5 animate-pulse text-amber-400" />;
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  workload,
  kind,
}: {
  workload: WorkloadDTO;
  kind: NodeKind;
}) {
  const kindMeta = getKindMeta(kind);
  const rows: Array<{ label: string; value: string }> = [
    { label: "ID", value: workload.id },
    { label: "Image", value: workload.image || "—" },
    { label: "State", value: workload.state },
    { label: "Kind", value: kindMeta.label },
    { label: "Endpoint", value: workload.endpoint || "Pending" },
    { label: "Blueprint", value: workload.blueprint_id || "—" },
    {
      label: "CPU",
      value: workload.cpu_millicores
        ? `${(workload.cpu_millicores / 1000).toFixed(2)} cores`
        : "—",
    },
    {
      label: "Memory",
      value: workload.memory_bytes
        ? `${(workload.memory_bytes / (1024 * 1024)).toFixed(0)} MB`
        : "—",
    },
    { label: "Created", value: new Date(workload.created_at).toLocaleString() },
    { label: "Updated", value: new Date(workload.updated_at).toLocaleString() },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-[0.4rem] border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">
          Container details
        </p>
        <div className="divide-y divide-white/8">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 py-2.5"
            >
              <span className="shrink-0 text-[11px] uppercase tracking-wide text-white/40">
                {label}
              </span>
              <span className="break-all text-right text-[12px] font-mono text-white/75">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {workload.error_message ? (
        <div className="rounded-[0.4rem] border border-red-400/20 bg-red-400/5 p-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-red-400/70">
            Error
          </p>
          <p className="text-[12px] text-red-300/80">{workload.error_message}</p>
        </div>
      ) : null}
    </div>
  );
}

// ── Console stub ──────────────────────────────────────────────────────────────

function ConsoleTab() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#0a0c10] p-4 font-mono text-[11px] text-white/30">
        Console not yet connected.
      </div>
      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-2 rounded-[0.35rem] border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="font-mono text-[11px] text-white/30">&gt;</span>
          <input
            className="flex-1 bg-transparent font-mono text-[11px] text-white/60 outline-none placeholder:text-white/20"
            placeholder="Command input coming soon…"
            disabled
          />
        </div>
      </div>
    </div>
  );
}

// ── Coming soon stub ──────────────────────────────────────────────────────────

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-white/30">{label} — coming soon</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ServerInstancePage({
  projectID,
  owner,
  slug,
  workloadID,
}: {
  projectID: string;
  owner: string;
  slug: string;
  workloadID: string;
}) {
  const router = useRouter();
  const [workload, setWorkload] = React.useState<WorkloadDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<Section>("logs");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const kind = workload
    ? inferNodeKind(workload.image, workload.blueprint_id)
    : "api";
  const status = workload
    ? mapStateToStatus(workload.state, isDeleting)
    : "starting";
  const statusMeta = getStatusMeta(status);
  const sections = getSections(kind);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getWorkload(projectID, workloadID)
      .then((data) => {
        if (!cancelled) setWorkload(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load workload");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectID, workloadID]);

  // Background poll to keep state fresh
  React.useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      getWorkload(projectID, workloadID)
        .then((data) => setWorkload(data))
        .catch(() => undefined);
    }, 5_000);
    return () => window.clearInterval(id);
  }, [projectID, workloadID]);

  async function handleDelete() {
    if (!confirm(`Delete ${workload?.name ?? "this workload"}? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteWorkload(projectID, workloadID);
      router.push(`/project/${owner}/${slug}/canvas`);
    } catch {
      setIsDeleting(false);
    }
  }

  const canvasHref = `/project/${owner}/${slug}/canvas`;
  const KindIcon = KIND_ICONS[kind];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/30">
        Loading…
      </div>
    );
  }

  if (error || !workload) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-400">{error ?? "Workload not found"}</p>
        <Link href={canvasHref} className="text-xs text-white/40 hover:text-white/60">
          ← Back to canvas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#050505] text-white">
      {/* ── Top header ──────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-5 py-3">
        <Link
          href={canvasHref}
          className="flex items-center gap-1.5 text-[12px] text-white/35 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Canvas
        </Link>

        <span className="text-white/15">/</span>

        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: getKindMeta(kind).accent }}
          >
            <KindIcon className="h-3 w-3 text-white/60" />
          </div>
          <span className="text-sm font-semibold text-white/90">
            {workload.name || workload.id}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-[0.3rem] border border-white/10 bg-white/5 px-2 py-1 text-[11px]">
          <StatusIcon status={status} />
          <span className={statusMeta.textClassName}>{statusMeta.label}</span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          className="flex items-center gap-1.5 rounded-[0.3rem] border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-white/8 hover:text-white/80 disabled:opacity-40"
          disabled={isDeleting}
          onClick={() => {
            // restart stub — daemon endpoint TBD
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>

        <button
          className="flex items-center gap-1.5 rounded-[0.3rem] border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-[12px] text-red-400/70 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* ── Body: left nav + content ────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="flex w-44 shrink-0 flex-col gap-px border-r border-white/8 px-2 py-3">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section];
            const active = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                  active
                    ? "bg-white/8 text-white/90"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/65",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {SECTION_LABELS[section]}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {activeSection === "overview" && (
            <div className="h-full overflow-y-auto">
              <OverviewTab workload={workload} kind={kind} />
            </div>
          )}
          {activeSection === "logs" && (
            <LogViewer workloadId={workloadID} projectID={projectID} />
          )}
          {activeSection === "metrics" && (
            <div className="h-full overflow-y-auto">
              <WorkloadMetricsTab
                workloadId={workloadID}
                projectID={projectID}
                cpuLimitMillicores={workload.cpu_millicores || undefined}
                memoryLimitBytes={workload.memory_bytes || undefined}
              />
            </div>
          )}
          {activeSection === "console" && <ConsoleTab />}
          {activeSection === "mods" && <ComingSoonTab label="Mod manager" />}
          {activeSection === "plugins" && <ComingSoonTab label="Plugin manager" />}
          {activeSection === "datapacks" && (
            <ComingSoonTab label="Datapack manager" />
          )}
        </div>
      </div>
    </div>
  );
}
