"use client";

import { useEffect, useState } from "react";
import { getProjectMetrics, type WorkloadMetricsDTO } from "@/lib/api/usage";

export function MetricBar({
  label,
  pct,
  primary,
  secondary,
}: {
  label: string;
  pct: number;
  primary: string;
  secondary?: string;
}) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const color =
    clampedPct > 80
      ? "bg-red-500"
      : clampedPct > 60
        ? "bg-amber-400"
        : "bg-emerald-400";
  return (
    <div className="space-y-1.5 rounded-[0.35rem] border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="uppercase tracking-wide text-white/40">{label}</span>
        <span className="font-medium text-white/70">{primary}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[0.2rem] bg-white/8">
        <div
          className={`h-full rounded-[0.2rem] ${color} transition-all duration-700`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      {secondary && <p className="text-[11px] text-white/35">{secondary}</p>}
    </div>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-[11px]">
      <span className="uppercase tracking-wide text-white/40">{label}</span>
      <span className="font-medium tabular-nums text-white/70">{value}</span>
    </div>
  );
}

function fmtMemory(mb: number): { primary: string; secondary: string } {
  if (mb >= 1000) {
    return { primary: `${(mb / 1024).toFixed(2)} GB`, secondary: `${mb} MB` };
  }
  return { primary: `${mb} MB`, secondary: `${(mb / 1024).toFixed(2)} GB` };
}

export function WorkloadMetricsTab({
  workloadId,
  projectID,
  cpuLimitMillicores,
  memoryLimitBytes,
}: {
  workloadId: string;
  projectID: string;
  cpuLimitMillicores?: number;
  memoryLimitBytes?: number;
}) {
  const [data, setData] = useState<WorkloadMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getProjectMetrics(projectID)
      .then((res) => {
        if (cancelled) return;
        const found =
          res.workloads?.find((w) => w.workload_id === workloadId) ?? null;
        setData(found);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workloadId, projectID]);

  if (loading) {
    return (
      <p className="p-5 text-[11px] text-white/40">Loading metrics…</p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-5 text-[11px] text-white/40">
        No metrics available yet. Start the workload and wait up to 30 s.
      </p>
    );
  }

  const fmt = (n: number, d = 1) => n.toFixed(d);
  const cpuLimitM =
    (data.cpu_limit_millicores > 0
      ? data.cpu_limit_millicores
      : cpuLimitMillicores) ?? 1000;
  const memLimitMB =
    data.memory_limit_bytes > 0
      ? data.memory_limit_bytes / (1024 * 1024)
      : memoryLimitBytes
        ? memoryLimitBytes / (1024 * 1024)
        : 2048;
  const cpuM = Math.min(data.cpu_millicores, cpuLimitM);
  const memMB = Math.min(data.memory_mb, memLimitMB);
  const cpuPct = (cpuM / cpuLimitM) * 100;
  const memPct = (memMB / memLimitMB) * 100;
  const memDisplay = fmtMemory(memMB);
  const memLimitDisplay = fmtMemory(memLimitMB);

  return (
    <div className="space-y-3 p-5">
      <MetricBar
        label="CPU"
        pct={cpuPct}
        primary={`${fmt(cpuM / 1000, 2)} cores`}
        secondary={`${fmt(cpuM / 1000, 2)} / ${fmt(cpuLimitM / 1000, 2)} cores`}
      />
      <MetricBar
        label="Memory"
        pct={memPct}
        primary={memDisplay.primary}
        secondary={`${memDisplay.secondary} / ${memLimitDisplay.primary}`}
      />
      <div className="divide-y divide-white/8 rounded-[0.35rem] border border-white/8 bg-white/[0.03] px-3">
        <StatRow label="Net In" value={`${fmt(data.network_in_kbps)} KB/s`} />
        <StatRow
          label="Net Out"
          value={`${fmt(data.network_out_kbps)} KB/s`}
        />
        <StatRow
          label="Disk Read"
          value={`${fmt(data.disk_read_kbps)} KB/s`}
        />
        <StatRow
          label="Disk Write"
          value={`${fmt(data.disk_write_kbps)} KB/s`}
        />
      </div>
      <p className="text-[10px] text-white/25">
        Last update: {new Date(data.recorded_at).toLocaleTimeString()}
      </p>
    </div>
  );
}
