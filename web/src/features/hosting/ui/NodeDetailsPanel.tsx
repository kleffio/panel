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
import { Sheet, SheetContent, SheetTitle } from "@kleffio/ui";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { LogViewer } from "@/features/hosting/ui/LogViewer";
import { WorkloadMetricsTab } from "@/features/hosting/ui/MetricWidgets";


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
  const { currentProjectID } = useCurrentProject();
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
        className="origin-right flex !right-4 !top-4 !bottom-4 !h-auto !w-[820px] ![max-width:calc(100vw-4rem)] flex-col overflow-hidden rounded-[0.5rem] border border-white/[0.08] bg-[linear-gradient(160deg,oklch(0.11_0_0)_0%,oklch(0.085_0_0)_50%,oklch(0.07_0_0)_100%)] p-0 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_80px_rgba(0,0,0,0.8),-60px_0_140px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm data-[state=open]:duration-520 data-[state=open]:ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:slide-in-from-right-8 data-[state=open]:zoom-in-[97%] data-[state=closed]:duration-260 data-[state=closed]:ease-[cubic-bezier(0.4,0,1,1)] data-[state=closed]:slide-out-to-right-5 data-[state=closed]:zoom-out-[99%]"
      >
        <SheetTitle className="sr-only">Node Details</SheetTitle>
        {node ? (
          <>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="border-b border-white/[0.07] px-5 pt-5 pb-0 bg-[linear-gradient(180deg,oklch(0.13_0_0)_0%,transparent_100%)]">
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
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:bg-primary"
                        : "text-white/35 hover:text-white/65"
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
                    <LogViewer workloadId={node.id} projectID={currentProjectID ?? ""} />
                  </motion.div>
                ) : null}

                {tab === "metrics" ? (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full overflow-y-auto"
                  >
                    <WorkloadMetricsTab
                      workloadId={node.id}
                      projectID={currentProjectID ?? ""}

                      cpuLimitMillicores={node.cpuLimitMillicores}
                      memoryLimitBytes={node.memoryLimitBytes}
                    />
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
                    <div className="rounded-[0.4rem] border border-white/[0.08] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.03]">
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
            <div className="flex items-center justify-between border-t border-white/[0.07] bg-[oklch(0.065_0_0)] px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <StatusIcon status={node.status} />
                <span>{status?.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {node.route ? (
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-[0.3rem] bg-white/[0.07] text-[12px] text-white/70 hover:bg-primary/10 hover:text-primary"
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
