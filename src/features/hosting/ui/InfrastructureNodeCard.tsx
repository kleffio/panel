"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Maximize2, Play, RotateCcw, ScrollText } from "lucide-react";
import { memo } from "react";
import Link from "next/link";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

import { getKindMeta, getStatusMeta, type InfrastructureFlowNodeData } from "@/features/hosting/lib/infrastructure-graph";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@kleffio/ui";

function getNodeLogoMeta(nodeId: string) {
  switch (nodeId) {
    case "frontend":
      return {
        token: "JS",
        className: "bg-[#e7d04c] text-[#151515] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "backend":
      return {
        token: "PY",
        className: "bg-[linear-gradient(135deg,#4da3ff,#f4c84e)] text-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "postgres":
      return {
        token: "PG",
        className: "bg-[#2f7adf] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "redis":
      return {
        token: "RD",
        className: "bg-[#d94b5b] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "proxy":
      return {
        token: "EN",
        className: "bg-[#7a849b] text-[#0e1220] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "workers":
      return {
        token: "WK",
        className: "bg-[#e0a54f] text-[#161616] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "minecraft":
      return {
        token: "MC",
        className: "bg-[#57c26d] text-[#102114] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    case "observability":
      return {
        token: "OB",
        className: "bg-[linear-gradient(135deg,#43d4d0,#4f8cff)] text-[#08131f] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
    default:
      return {
        token: "SV",
        className: "bg-white/10 text-[var(--test-foreground)] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      };
  }
}

const MetricBar = memo(function MetricBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/6">
        <div
          className="h-full rounded-full bg-[var(--test-accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
});

export const InfrastructureNodeCard = memo(function InfrastructureNodeCard({
  data,
  selected,
}: NodeProps<InfrastructureFlowNodeData>) {
  const { node, highlighted, onAction } = data;
  const status = getStatusMeta(node.status);
  const kind = getKindMeta(node.kind);
  const logo = getNodeLogoMeta(node.id);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          animate={{
            y: highlighted ? [0, -4, 0] : 0,
            boxShadow: highlighted
              ? [
                  "0 24px 48px rgba(0, 0, 0, 0.28)",
                  "0 26px 60px rgba(246, 193, 119, 0.28)",
                  "0 24px 48px rgba(0, 0, 0, 0.28)",
                ]
              : "0 24px 48px rgba(0, 0, 0, 0.28)",
          }}
          transition={{
            duration: highlighted ? 2.4 : 0.2,
            repeat: highlighted ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
          className={`relative min-w-[280px] max-w-[280px] rounded-[22px] border backdrop-blur-xl ${
            highlighted
              ? "border-amber-300/28 bg-[rgba(33,28,23,0.92)]"
              : "border-white/6 bg-[var(--test-panel-card)]"
          } ${selected ? "ring-2 ring-amber-300/40 ring-offset-2 ring-offset-transparent" : ""}`}
          style={{ backgroundImage: `linear-gradient(180deg, ${kind.accent}, transparent)` }}
        >
          <Handle id="top" type="source" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="right" type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="bottom" type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="left" type="source" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="top" type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="right" type="target" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="bottom" type="target" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
          <Handle id="left" type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-transparent" />

          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[11px] font-bold tracking-[0.02em] ${logo.className}`}>
                  {logo.token}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[15px] font-semibold text-[var(--test-foreground)]">
                      {node.name}
                    </strong>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--test-muted)]">{node.subtitle}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {highlighted ? (
                  <span className="rounded-full border border-amber-300/30 bg-amber-400/12 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-100">
                    AI flag
                  </span>
                ) : null}
                {node.route ? (
                  <Link
                    href={node.route}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-[var(--test-muted)] transition-colors hover:bg-white/[0.08] hover:text-[var(--test-foreground)]"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${status.dotClassName}`} />
                <span className={status.textClassName}>{status.label}</span>
              </div>
              <span className="text-xs text-[var(--test-muted)]">{node.metrics.traffic}</span>
            </div>

            <div className="grid gap-3">
              <MetricBar label="CPU" value={node.metrics.cpu} />
              <MetricBar label="RAM" value={node.metrics.ram} />
            </div>

            <div className="flex flex-wrap gap-2">
              {node.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--test-muted)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {node.footer ? (
            <div className="overflow-hidden rounded-b-[22px] border-t border-white/6 bg-black/12 px-4 py-2.5 text-xs text-[var(--test-muted)]">
              {node.footer}
            </div>
          ) : null}
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent className="rounded-2xl border border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)]">
        <ContextMenuLabel>{node.name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onAction(node.id, "restart")}>
          <RotateCcw className="h-4 w-4" />
          Restart
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onAction(node.id, "logs")}>
          <ScrollText className="h-4 w-4" />
          Logs
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onAction(node.id, "scale")}>
          <Maximize2 className="h-4 w-4" />
          Scale
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onAction(node.id, "restart")}>
          <Play className="h-4 w-4" />
          Quick recover
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}, (prev, next) =>
  prev.data.node === next.data.node &&
  prev.data.highlighted === next.data.highlighted &&
  prev.selected === next.selected,
);
