"use client";

import { memo } from "react";
import type { EdgeProps } from "reactflow";
import { BaseEdge, getBezierPath } from "reactflow";

import { type InfrastructureFlowEdgeData } from "@/features/hosting/lib/infrastructure-graph";

export const EdgeConnection = memo(function EdgeConnection({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<InfrastructureFlowEdgeData>) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const stroke =
    data?.highlighted
      ? "rgba(246, 193, 119, 0.82)"
      : data?.dimmed
        ? data?.edge.kind === "dependency"
          ? "rgba(212, 218, 235, 0.06)"
          : data?.edge.kind === "network"
            ? "rgba(113, 196, 255, 0.09)"
            : "rgba(245, 181, 23, 0.08)"
      : data?.edge.kind === "dependency"
        ? "rgba(255,255,255,0.22)"
        : data?.edge.kind === "network"
          ? "rgba(113,196,255,0.35)"
          : "rgba(245,181,23,0.35)";

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke,
        strokeWidth: data?.highlighted ? 1.8 : data?.dimmed ? 0.8 : 1.2,
        strokeDasharray: data?.edge.kind === "dependency" ? "4 8" : undefined,
      }}
    />
  );
});
