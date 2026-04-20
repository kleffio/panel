"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Maximize2,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { AiSuggestion, InfrastructureNode, NodeAction } from "@/features/hosting/model/types";
import { getStatusMeta } from "@/features/hosting/lib/infrastructure-graph";
import { Button } from "@kleffio/ui";
import { Sheet, SheetContent } from "@kleffio/ui";

// ── Fake log generation ────────────────────────────────────────────────────────

type LogLevel = "info" | "ok" | "warn" | "error";
interface LogLine { time: string; text: string; level: LogLevel }

function fakeTs(now: Date, offsetMs: number) {
  const d = new Date(now.getTime() - offsetMs);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function generateFakeLogs(node: InfrastructureNode): LogLine[] {
  const now = new Date();
  const t = (ms: number) => fakeTs(now, ms);
  const image = node.subtitle || node.name;

  if (node.kind === "game-server") {
    return [
      { time: t(48000), text: `Pulling image: ${image}`, level: "info" },
      { time: t(44000), text: "Image pulled successfully", level: "ok" },
      { time: t(40000), text: "Creating container...", level: "info" },
      { time: t(34000), text: "[Server] Starting Minecraft server version 1.21", level: "info" },
      { time: t(28000), text: "[Server] Default game type: SURVIVAL", level: "info" },
      { time: t(22000), text: "[Server] Generating keypair", level: "info" },
      { time: t(16000), text: "[Server] Preparing start region for dimension minecraft:overworld", level: "info" },
      { time: t(10000), text: "[Server] Time elapsed: 6345 ms", level: "info" },
      { time: t(6000),  text: "[Server] Done! For help, type 'help'", level: "ok" },
      { time: t(1000),  text: "Server is running and accepting connections on *:25565", level: "ok" },
    ];
  }

  if (node.kind === "database") {
    return [
      { time: t(56000), text: `Pulling image: ${image}`, level: "info" },
      { time: t(51000), text: "Image pulled successfully", level: "ok" },
      { time: t(46000), text: "Initializing database cluster...", level: "info" },
      { time: t(40000), text: "Files belonging to this database system will be owned by user 'postgres'", level: "info" },
      { time: t(34000), text: "Data page checksums are enabled.", level: "info" },
      { time: t(28000), text: "fixing permissions on existing directory /var/lib/postgresql/data ... ok", level: "ok" },
      { time: t(20000), text: "creating subdirectories ... ok", level: "ok" },
      { time: t(14000), text: "LOG: starting PostgreSQL 16.2 on x86_64-pc-linux-musl", level: "info" },
      { time: t(8000),  text: "LOG: listening on IPv4 address '0.0.0.0', port 5432", level: "info" },
      { time: t(2000),  text: "LOG: database system is ready to accept connections", level: "ok" },
    ];
  }

  if (node.kind === "cache") {
    return [
      { time: t(32000), text: `Pulling image: ${image}`, level: "info" },
      { time: t(28000), text: "Image pulled successfully", level: "ok" },
      { time: t(24000), text: "# oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo", level: "info" },
      { time: t(20000), text: `Redis version=7.2.4, bits=64, pid=1`, level: "info" },
      { time: t(15000), text: "Configuration loaded", level: "info" },
      { time: t(10000), text: "* monotonic clock: POSIX clock_gettime", level: "info" },
      { time: t(5000),  text: "* Server initialized", level: "ok" },
      { time: t(1000),  text: "* Ready to accept connections tcp", level: "ok" },
    ];
  }

  if (node.kind === "proxy") {
    return [
      { time: t(38000), text: `Pulling image: ${image}`, level: "info" },
      { time: t(34000), text: "Image pulled successfully", level: "ok" },
      { time: t(30000), text: 'level=info msg="Configuration loaded from file: /etc/traefik/traefik.yml"', level: "info" },
      { time: t(25000), text: 'level=info msg="Traefik version 3.0.0 built"', level: "info" },
      { time: t(20000), text: 'level=info msg="Starting provider aggregator service provider"', level: "info" },
      { time: t(15000), text: 'level=info msg="Starting provider *docker.Provider"', level: "info" },
      { time: t(9000),  text: 'level=info msg="Entrypoint opened" entryPointName=web address=:80', level: "ok" },
      { time: t(4000),  text: 'level=info msg="Entrypoint opened" entryPointName=websecure address=:443', level: "ok" },
      { time: t(500),   text: "Proxy is ready — routing traffic", level: "ok" },
    ];
  }

  // api / app / worker / support
  return [
    { time: t(70000), text: `Pulling image: ${image}`, level: "info" },
    { time: t(64000), text: "Image pulled successfully", level: "ok" },
    { time: t(60000), text: "Creating container...", level: "info" },
    { time: t(54000), text: "Installing dependencies...", level: "info" },
    { time: t(46000), text: "added 312 packages in 4.2s", level: "info" },
    { time: t(38000), text: "Building application...", level: "info" },
    { time: t(28000), text: "Build complete in 9.7s", level: "ok" },
    { time: t(20000), text: "Running start script", level: "info" },
    { time: t(12000), text: "Server listening on port 3000", level: "ok" },
    { time: t(6000),  text: "Health check passed", level: "ok" },
    { time: t(800),   text: "Deployment successful", level: "ok" },
  ];
}

// ── Log viewer ─────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:  "text-white/70",
  ok:    "text-emerald-400",
  warn:  "text-amber-400",
  error: "text-red-400",
};

function LogViewer({ node }: { node: InfrastructureNode }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const logs = generateFakeLogs(node);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [node.id]);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0c10] font-mono text-[11px] leading-5">
      <div className="p-4 pb-6">
        {logs.map((line, i) => (
          <div key={i} className="flex gap-3 py-[1px]">
            <span className="w-16 shrink-0 select-none text-white/25">{line.time}</span>
            <span className={LEVEL_COLOR[line.level]}>{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Metric bar ─────────────────────────────────────────────────────────────────

function MetricBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  const color = value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="uppercase tracking-wide text-white/40">{label}</span>
        <span className="font-medium text-white/70">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-[11px] text-white/35">{detail}</p>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

type Tab = "logs" | "overview" | "metrics";

// ── Status icon ────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: InfrastructureNode["status"] }) {
  if (status === "running") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "deleting") return <XCircle className="h-4 w-4 text-red-300/70" />;
  return <Circle className="h-4 w-4 animate-pulse text-amber-400" />;
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export const NodeDetailsPanel = memo(function NodeDetailsPanel({
  node,
  open,
  onOpenChange,
  onAction,
  relatedNodes,
  suggestions,
}: {
  node: InfrastructureNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (nodeId: string, action: NodeAction) => void;
  relatedNodes: InfrastructureNode[];
  suggestions: AiSuggestion[];
}) {
  const [tab, setTab] = useState<Tab>("logs");
  const status = node ? getStatusMeta(node.status) : null;

  // Reset to logs tab when a new node is selected
  useEffect(() => {
    setTab("logs");
  }, [node?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[580px] flex-col border-[var(--test-border)] bg-[#0e1117] p-0 text-white sm:max-w-[580px]"
      >
        {node ? (
          <>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="border-b border-white/8 px-5 pt-6 pb-0">
              <div className="mb-4 flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-semibold leading-tight text-white">
                    {node.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-white/40">
                    {node.subtitle || node.kind}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]">
                  <StatusIcon status={node.status} />
                  <span className={status?.textClassName ?? "text-white/60"}>{status?.label}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0">
                {(["logs", "overview", "metrics"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative px-4 pb-3 text-[12px] font-medium capitalize transition-colors ${
                      tab === t
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab body ─────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {tab === "logs" ? (
                <LogViewer node={node} />
              ) : tab === "metrics" ? (
                <div className="space-y-3 overflow-y-auto p-5">
                  <MetricBar label="CPU" value={node.metrics.cpu} detail={node.metrics.traffic} />
                  <MetricBar label="RAM" value={node.metrics.ram} detail={node.metrics.ramLabel} />

                  {node.footer ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-white/40">Endpoint</p>
                      <p className="mt-1 break-all text-xs text-white/70">{node.footer}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* overview */
                <div className="space-y-4 overflow-y-auto p-5">
                  <div className="rounded-2xl border border-amber-300/20 bg-[rgba(47,34,14,0.52)] p-4">
                    <p className="mb-3 text-[11px] uppercase tracking-wide text-amber-100/75">
                      Container information
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                        <span className="text-[10px] uppercase tracking-wide text-white/40">Name</span>
                        <span className="text-xs text-white/80">{node.name}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                        <span className="text-[10px] uppercase tracking-wide text-white/40">Image</span>
                        <span className="max-w-[65%] truncate text-right text-xs text-white/80">{node.subtitle || "n/a"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                        <span className="text-[10px] uppercase tracking-wide text-white/40">Container ID</span>
                        <span className="break-all text-right font-mono text-[11px] text-white/70">{node.id}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                        <span className="text-[10px] uppercase tracking-wide text-white/40">Endpoint</span>
                        <span className="max-w-[65%] break-all text-right text-xs text-white/80">{node.footer ?? node.metrics.traffic}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational notes */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">Details</p>
                    <ul className="space-y-2">
                      {node.panel.highlights.map((h) => (
                        <li key={h} className="text-xs leading-5 text-white/60">{h}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Related services */}
                  {relatedNodes.length > 0 ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">
                        Connected services
                      </p>
                      <div className="space-y-2">
                        {relatedNodes.map((rn) => (
                          <div
                            key={rn.id}
                            className="rounded-lg border border-white/6 bg-black/20 px-3 py-2"
                          >
                            <p className="text-xs font-medium text-white/80">{rn.name}</p>
                            <p className="mt-0.5 text-[11px] text-white/35">{rn.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* AI suggestions */}
                  {suggestions.length > 0 ? (
                    <div className="rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <p className="text-[11px] uppercase tracking-wide text-amber-300/80">
                          AI recommendations
                        </p>
                      </div>
                      <div className="space-y-2">
                        {suggestions.map((s) => (
                          <div key={s.id} className="rounded-lg border border-white/6 bg-black/20 p-3">
                            <p className="text-xs font-medium text-white/80">{s.title}</p>
                            <p className="mt-1 text-[11px] leading-5 text-white/45">{s.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── Footer action bar ─────────────────────────────────── */}
            <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <StatusIcon status={node.status} />
                <span>{status?.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {node.route ? (
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-lg bg-white/10 text-[12px] text-white/80 hover:bg-white/15"
                  >
                    <Link href={node.route}>
                      Open
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
                {node.actions.includes("scale") ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-[12px] text-white/60 hover:bg-white/8 hover:text-white/80"
                    onClick={() => onAction(node.id, "scale")}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Scale
                  </Button>
                ) : null}
                {node.actions.includes("restart") ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-[12px] text-white/60 hover:bg-white/8 hover:text-white/80"
                    onClick={() => onAction(node.id, "restart")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </Button>
                ) : null}
                {node.actions.includes("delete") ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-[12px] text-red-400/70 hover:bg-red-400/10 hover:text-red-300"
                    onClick={() => onAction(node.id, "delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}, (prev, next) =>
  prev.open === next.open &&
  prev.node?.id === next.node?.id &&
  prev.node?.status === next.node?.status &&
  prev.node?.metrics.cpu === next.node?.metrics.cpu &&
  prev.node?.metrics.ram === next.node?.metrics.ram &&
  prev.node?.metrics.ramLabel === next.node?.metrics.ramLabel &&
  prev.node?.metrics.traffic === next.node?.metrics.traffic &&
  prev.relatedNodes === next.relatedNodes &&
  prev.suggestions === next.suggestions
);
