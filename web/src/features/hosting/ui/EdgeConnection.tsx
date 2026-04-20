"use client";

import { memo } from "react";
import type { EdgeProps } from "reactflow";
import { BaseEdge, getSmoothStepPath } from "reactflow";

import { getEdgeSpreadIndex, type InfrastructureFlowEdgeData } from "@/features/hosting/lib/infrastructure-graph";

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
  const edgeIndex = data?.edge ? getEdgeSpreadIndex(data.edge.id) : 0;
  const spreadOffset = 20 + edgeIndex * 16;

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 18,
    offset: spreadOffset,
  });

  const stroke =
    data?.highlighted
      ? "rgba(246, 193, 119, 0.82)"
      : data?.dimmed
        ? data?.edge.kind === "dependency"
          ? "rgba(212, 218, 235, 0.08)"
          : data?.edge.kind === "network"
            ? "rgba(113, 196, 255, 0.11)"
            : "rgba(196, 204, 227, 0.08)"
      : data?.edge.kind === "dependency"
        ? "rgba(212, 218, 235, 0.16)"
        : data?.edge.kind === "network"
          ? "rgba(113, 196, 255, 0.24)"
          : "rgba(196, 204, 227, 0.18)";

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke,
        strokeWidth: data?.highlighted ? 1.8 : data?.dimmed ? 0.9 : 1.2,
        strokeDasharray: data?.edge.kind === "dependency" ? "4 8" : undefined,
      }}
    />
  );
});
