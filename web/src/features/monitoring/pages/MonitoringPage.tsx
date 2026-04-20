"use client";

import { Activity, AlertTriangle, CheckCircle2, Clock, Cpu, HardDrive, MemoryStick, Wifi } from "lucide-react";

const PLACEHOLDER_METRICS = [
  { label: "CPU Usage",      value: "—",  unit: "%",  icon: Cpu,         status: "neutral" as const },
  { label: "Memory",         value: "—",  unit: "GB", icon: MemoryStick, status: "neutral" as const },
  { label: "Network In",     value: "—",  unit: "MB/s", icon: Wifi,      status: "neutral" as const },
  { label: "Disk I/O",       value: "—",  unit: "MB/s", icon: HardDrive, status: "neutral" as const },
];

const PLACEHOLDER_ALERTS = [
  { id: 1, severity: "info"    as const, message: "Monitoring agent not yet connected",    time: "—" },
  { id: 2, severity: "info"    as const, message: "Metrics collection coming soon",         time: "—" },
];

export function MonitoringPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time metrics and alerts for your project workloads.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-amber-500/70" />
          Coming soon
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLACEHOLDER_METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/[0.07] bg-card p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <span className="flex size-7 items-center justify-center rounded-md bg-white/[0.04]">
                <m.icon className="size-4 text-muted-foreground/50" />
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground/30">{m.value}</p>
            <p className="text-xs text-muted-foreground/50">{m.unit}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart placeholder */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Request Rate
            </h2>
            <span className="text-xs text-muted-foreground/50">Last 24h</span>
          </div>
          <div className="px-6 py-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-12 rounded-full border border-white/[0.07] bg-white/[0.03] flex items-center justify-center">
              <Activity className="size-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground/50">No metrics data yet</p>
            <p className="text-xs text-muted-foreground/30 max-w-xs">
              Connect your workloads and metrics will appear here automatically.
            </p>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-primary" />
              Alerts
            </h2>
            <span className="text-xs text-muted-foreground/50">{PLACEHOLDER_ALERTS.length} total</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {PLACEHOLDER_ALERTS.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-6 py-3">
                {alert.severity === "info" ? (
                  <CheckCircle2 className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-foreground/60 leading-snug">{alert.message}</p>
                  <p className="text-xs text-muted-foreground/40 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status table placeholder */}
      <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold">Workload Health</h2>
        </div>
        <div className="px-6 py-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-12 rounded-full border border-white/[0.07] bg-white/[0.03] flex items-center justify-center">
            <HardDrive className="size-5 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground/50">No workloads reporting yet</p>
          <p className="text-xs text-muted-foreground/30 max-w-xs">
            Deploy workloads from the Canvas to see their health status here.
          </p>
        </div>
      </div>
    </div>
  );
}
