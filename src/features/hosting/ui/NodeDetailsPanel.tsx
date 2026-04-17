"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Maximize2,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import type { InfrastructureNode, NodeAction } from "@/features/hosting/model/types";
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
    <div className="space-y-1.5 rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="uppercase tracking-wide text-white/40">{label}</span>
        <span className="font-medium text-white/70">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[0.2rem] bg-white/8">
        <div className={`h-full rounded-[0.2rem] ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
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
}: {
  node: InfrastructureNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (nodeId: string, action: NodeAction) => void;
  relatedNodes: InfrastructureNode[];
}) {
  const [tab, setTab] = useState<Tab>("logs");
  const [isSheetOpen, setIsSheetOpen] = useState(open);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const status = node ? getStatusMeta(node.status) : null;

  const endpointValue = useMemo(() => {
    if (!node) return "";

    const fromHighlights = node.panel.highlights
      .find((line) => line.toLowerCase().startsWith("endpoint:"))
      ?.replace(/^endpoint:\s*/i, "")
      .trim();

    return (node.footer?.trim() || fromHighlights || "").trim();
  }, [node]);

  const showEndpoint = useMemo(() => {
    if (!endpointValue) return false;
    if (endpointValue.toLowerCase().includes("pending")) return false;

    return /(https?:\/\/|localhost|:\d{2,5}\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|\b[a-z0-9.-]+\.[a-z]{2,}\b)/i.test(endpointValue);
  }, [endpointValue]);

  const overviewHighlights = useMemo(() => {
    if (!node) return [];

    return node.panel.highlights.filter((line) => {
      const normalized = line.toLowerCase();
      if (normalized.startsWith("endpoint:")) return false;
      if (normalized.startsWith("state:")) return false;

      return true;
    });
  }, [node]);

  // Reset to logs tab when a new node is selected
  useEffect(() => {
    setTab("logs");
  }, [node?.id]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsSheetOpen(true);
      return;
    }

    setIsSheetOpen(false);
  }, [open, node?.id]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsSheetOpen(true);
      onOpenChange(true);
      return;
    }

    setIsSheetOpen(false);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onOpenChange(false);
    }, 260);
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="origin-right flex !right-8 !top-5 !bottom-5 !h-auto w-[640px] max-w-[calc(100vw-5rem)] flex-col overflow-hidden rounded-[0.45rem] border border-white/14 bg-[linear-gradient(180deg,rgba(10,14,22,0.99)_0%,rgba(6,9,15,0.99)_100%)] p-0 text-white ring-1 ring-white/8 shadow-[0_84px_190px_rgba(0,0,0,0.9),_-44px_0_130px_rgba(0,0,0,0.68),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm data-[state=open]:duration-520 data-[state=open]:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:slide-in-from-right-8 data-[state=open]:zoom-in-[97%] data-[state=closed]:duration-260 data-[state=closed]:ease-[cubic-bezier(0.4,0,1,1)] data-[state=closed]:slide-out-to-right-5 data-[state=closed]:zoom-out-[99%]"
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
                <div className="flex shrink-0 items-center gap-1.5 rounded-[0.3rem] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]">
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
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-sky-300"
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
              <AnimatePresence mode="wait" initial={false}>
                {tab === "logs" ? (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    <LogViewer node={node} />
                  </motion.div>
                ) : null}

                {tab === "metrics" ? (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full space-y-3 overflow-y-auto p-5"
                  >
                    <MetricBar label="CPU" value={node.metrics.cpu} detail={node.metrics.traffic} />
                    <MetricBar label="RAM" value={node.metrics.ram} detail={node.metrics.ramLabel} />

                    <div className="rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-white/40">Load profile</p>
                      <p className="mt-1 text-xs text-white/70">{node.metrics.traffic}</p>
                      <p className="mt-1 text-[11px] text-white/45">
                        {showEndpoint ? "Public endpoint is available" : "No public endpoint exposed"}
                      </p>
                    </div>
                  </motion.div>
                ) : null}

                {tab === "overview" ? (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full space-y-4 overflow-y-auto p-5"
                  >
                    <div className="rounded-[0.4rem] border border-white/12 bg-[rgba(14,20,31,0.76)] p-4">
                      <p className="mb-2 text-[11px] uppercase tracking-wide text-white/70">
                        Container information
                      </p>
                      <div className="divide-y divide-white/8 text-xs">
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[10px] uppercase tracking-wide text-white/40">Name</span>
                          <span className="text-right text-white/82">{node.name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[10px] uppercase tracking-wide text-white/40">Image</span>
                          <span className="max-w-[65%] truncate text-right text-white/82">{node.subtitle || "n/a"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[10px] uppercase tracking-wide text-white/40">Container ID</span>
                          <span className="max-w-[70%] truncate text-right font-mono text-[11px] text-white/74">{node.id}</span>
                        </div>
                        {showEndpoint ? (
                          <div className="flex items-center justify-between gap-3 py-2.5">
                            <span className="text-[10px] uppercase tracking-wide text-white/40">Endpoint</span>
                            <span className="max-w-[65%] break-all text-right text-white/82">{endpointValue}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-4">
                      <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">Details</p>
                      {overviewHighlights.length > 0 ? (
                        <ul className="space-y-2">
                          {overviewHighlights.map((h) => (
                            <li key={h} className="text-xs leading-5 text-white/60">{h}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs leading-5 text-white/55">No runtime issues reported.</p>
                      )}
                    </div>

                    {relatedNodes.length > 0 ? (
                      <div className="rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-4">
                        <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">
                          Connected services
                        </p>
                        <div className="space-y-2">
                          {relatedNodes.map((rn) => (
                            <div
                              key={rn.id}
                              className="rounded-[0.25rem] border border-white/6 bg-black/20 px-3 py-2"
                            >
                              <p className="text-xs font-medium text-white/80">{rn.name}</p>
                              <p className="mt-0.5 text-[11px] text-white/35">{rn.subtitle}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {node.badges.length > 0 ? (
                      <div className="rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-4">
                        <p className="mb-3 text-[11px] uppercase tracking-wide text-white/40">Labels</p>
                        <div className="flex flex-wrap gap-2">
                          {node.badges.map((badge) => (
                            <span
                              key={badge}
                              className="rounded-[0.22rem] border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
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
                    className="h-8 rounded-[0.3rem] bg-white/10 text-[12px] text-white/80 hover:bg-sky-400/12 hover:text-sky-300"
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
                    className="h-8 rounded-[0.3rem] text-[12px] text-white/60 hover:bg-white/8 hover:text-white/80"
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
                    className="h-8 rounded-[0.3rem] text-[12px] text-white/60 hover:bg-white/8 hover:text-white/80"
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
                    className="h-8 rounded-[0.3rem] text-[12px] text-red-400/70 hover:bg-red-400/10 hover:text-red-300"
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
  prev.relatedNodes === next.relatedNodes
);
