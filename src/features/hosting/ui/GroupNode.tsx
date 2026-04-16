"use client";

import { Edit2, X } from "lucide-react";
import { memo } from "react";
import type { NodeProps } from "reactflow";

import type { NodeStatus } from "@/features/hosting/model/types";
import { GROUP_ROLES } from "./GroupManagerModal";

export const GROUP_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f43f5e", // rose
  "#f59e0b", // amber
];

export interface GroupNodeData {
  label: string;
  color: string;
  memberIds: string[];
  memberCount: number;
  avgCpu: number | null;
  computedStatus: NodeStatus | null;
  notes: string;
  role: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function StatusDot({ status }: { status: NodeStatus | null }) {
  if (!status || status === "running") {
    return (
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: status === "running" ? "#34d399" : "transparent" }}
      />
    );
  }
  if (status === "error" || status === "deleting") {
    return <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />;
  }
  return <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />;
}

export const GroupNode = memo(function GroupNode({
  id,
  data,
}: NodeProps<GroupNodeData>) {
  const roleInfo = GROUP_ROLES.find((r) => r.id === data.role);

  return (
    <div
      className="relative h-full w-full rounded-2xl"
      style={{
        border: `1.5px dashed ${data.color}50`,
        backgroundColor: `${data.color}07`,
        pointerEvents: "none",
      }}
    >
      {/* Label bar */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center gap-2 rounded-t-2xl px-3 py-2"
        style={{
          backgroundColor: `${data.color}16`,
          borderBottom: `1px solid ${data.color}25`,
          pointerEvents: "auto",
        }}
      >
        <StatusDot status={data.computedStatus} />

        <span className="flex-1 truncate text-sm font-semibold" style={{ color: data.color }}>
          {data.label}
        </span>

        {/* Role badge */}
        {roleInfo ? (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: `${data.color}15`, color: `${data.color}cc` }}
          >
            {roleInfo.emoji} {roleInfo.label}
          </span>
        ) : null}

        {/* Member count badge */}
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${data.color}20`, color: data.color }}
        >
          {data.memberCount === 0 ? "empty" : `${data.memberCount} node${data.memberCount === 1 ? "" : "s"}`}
        </span>

        {/* Avg CPU */}
        {data.avgCpu !== null ? (
          <span className="shrink-0 text-[10px]" style={{ color: `${data.color}80` }}>
            avg {data.avgCpu}% cpu
          </span>
        ) : null}

        {/* Edit */}
        <button
          className="shrink-0 rounded p-0.5 opacity-40 transition-opacity hover:opacity-100"
          style={{ color: data.color }}
          title="Edit group"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit(id);
          }}
        >
          <Edit2 className="h-3 w-3" />
        </button>

        {/* Delete */}
        <button
          className="shrink-0 rounded p-0.5 opacity-30 transition-opacity hover:opacity-100 hover:text-red-400"
          style={{ color: data.color }}
          title="Delete group"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Notes */}
      {data.notes ? (
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <p className="text-[10px] leading-4 opacity-45" style={{ color: data.color }}>
            {data.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
});
