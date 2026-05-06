"use client";

import * as React from "react";
import { BarChart2, Cpu, HardDrive, MemoryStick, RefreshCw, Server, Wifi } from "lucide-react";
import { PluginSlot } from "@/features/plugins/ui/PluginSlot";
import { getAllMetrics, type WorkloadMetricsDTO } from "@/lib/api/usage";

const POLL_INTERVAL_MS = 30_000;

function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

function fmtMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function aggregate(workloads: WorkloadMetricsDTO[]) {
  return workloads.reduce(
    (acc, w) => ({
      cpuMillicores: acc.cpuMillicores + w.cpu_millicores,
      memoryMB: acc.memoryMB + w.memory_mb,
      networkInKbps: acc.networkInKbps + w.network_in_kbps,
      networkOutKbps: acc.networkOutKbps + w.network_out_kbps,
      diskReadKbps: acc.diskReadKbps + w.disk_read_kbps,
      diskWriteKbps: acc.diskWriteKbps + w.disk_write_kbps,
    }),
    { cpuMillicores: 0, memoryMB: 0, networkInKbps: 0, networkOutKbps: 0, diskReadKbps: 0, diskWriteKbps: 0 }
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminMonitoringPage() {
  const [workloads, setWorkloads] = React.useState<WorkloadMetricsDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const doFetch = React.useCallback(async () => {
    try {
      const data = await getAllMetrics();
      setWorkloads(data.workloads ?? []);
      setLastUpdated(new Date());
    } catch {
      setWorkloads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    doFetch();
    const id = setInterval(doFetch, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [doFetch]);

  const totals = React.useMemo(() => aggregate(workloads), [workloads]);
  const hasData = workloads.length > 0;

  const summaryCards = [
    {
      label: "Total CPU",
      value: fmt(totals.cpuMillicores / 1000, 2),
      unit: "cores",
      sub: `across ${workloads.length} workload${workloads.length !== 1 ? "s" : ""}`,
      icon: Cpu,
    },
    {
      label: "Total Memory",
      value: fmtMB(totals.memoryMB),
      unit: "",
      sub: "across all workloads",
      icon: MemoryStick,
    },
    {
      label: "Network",
      value: fmt(totals.networkInKbps),
      unit: "KB/s in",
      sub: `out: ${fmt(totals.networkOutKbps)} KB/s`,
      icon: Wifi,
    },
    {
      label: "Disk I/O",
      value: fmt(totals.diskReadKbps),
      unit: "KB/s read",
      sub: `write: ${fmt(totals.diskWriteKbps)} KB/s`,
      icon: HardDrive,
    },
    {
      label: "Active Workloads",
      value: String(workloads.length),
      unit: "",
      sub: "reporting metrics",
      icon: Server,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Infrastructure</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregated metrics across all workloads and projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground/50">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => { doFetch(); setRefreshKey((k) => k + 1); }}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground hover:bg-white/[0.08] transition-colors"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-32">
          <p className="text-sm text-muted-foreground/40 animate-pulse">Loading…</p>
        </div>
      ) : !hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06]">
            <BarChart2 className="size-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No metrics yet</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs text-center">Start a workload and metrics will appear here within 30 seconds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {summaryCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-white/[0.07] bg-card p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                <span className="flex size-7 items-center justify-center rounded-md bg-white/[0.04]">
                  <c.icon className="size-4 text-muted-foreground/50" />
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight">
                {c.value}
                {c.unit && <span className="text-lg font-normal text-muted-foreground ml-1">{c.unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground/40">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      <PluginSlot name="monitoring.charts" slotProps={{ refreshKey, showHost: true }} />
    </div>
  );
}
