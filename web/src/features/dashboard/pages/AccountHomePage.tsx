"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Container,
  Activity,
  ArrowUpRight,
  GitCommit,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Plus,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  ServerCrash,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { listWorkloads } from "@/lib/api/projects";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kleffio/ui";

// ── Mock data ──────────

const MOCK_ACTIVITY = [
  { icon: "check" as const, message: "prod-api deployed successfully", time: "12 min ago" },
  { icon: "alert" as const, message: "API latency spiked to 450ms", time: "24 min ago" },
  { icon: "check" as const, message: "Database backup completed", time: "4 hr ago" },
  { icon: "commit" as const, message: "auth-worker scaled to 3 replicas", time: "6 hr ago" },
  { icon: "commit" as const, message: "redis-cache provisioned", time: "Yesterday" },
];

export function AccountHomePage() {
  const auth = useAuth();
  const { projects } = useCurrentProject();
  const [runningCount, setRunningCount] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState("24h");

  const user = auth.user;
  const username = (user?.profile?.preferred_username as string | undefined)
    ?? (user?.profile?.sub as string | undefined)
    ?? "user";
  const displayName =
    user?.profile?.given_name ??
    (user?.profile?.name as string | undefined)?.split(" ")[0] ??
    username ??
    "there";

  const totalSpend = 47.50; // Mock total spend

  // Count running workloads across all projects
  useEffect(() => {
    if (projects.length === 0) {
      setRunningCount(0);
      return;
    }
    Promise.all(projects.map((p) => listWorkloads(p.id)))
      .then((results) => {
        const running = results.flatMap((r) => r.workloads ?? []).filter(
          (w) => w.state === "running"
        ).length;
        setRunningCount(running);
      })
      .catch(() => setRunningCount(0));
  }, [projects]);

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500 z-0 px-4 sm:px-6 lg:px-8 pb-12">
      {/* Ambient Background Glows & Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-kleff-grid [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_40%,transparent_100%)] opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 top-80 -z-10 h-[24rem] w-[24rem] rounded-full bg-blue-500/5 blur-[100px]" />
      <div className="pointer-events-none absolute -left-20 top-[30rem] -z-10 h-[24rem] w-[24rem] rounded-full bg-purple-500/5 blur-[100px]" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-widest text-primary/80">Account Home</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white capitalize drop-shadow-sm">{displayName}&apos;s Account</h1>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 shadow-[0_0_20px_rgba(245,181,23,0.3)]">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Project</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Analytics */}
      <div className="space-y-4 relative z-10 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/90">Analytics</h2>
          <div className="relative">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[160px] glass-surface border border-white/10 text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium h-9 shadow-[0_0_15px_rgba(255,255,255,0.02)] focus:ring-1 focus:ring-primary/50 focus:border-primary/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-white/40" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0c] border border-white/10 text-white shadow-xl">
                <SelectItem value="1h" className="focus:bg-white/10 focus:text-white cursor-pointer">Last hour</SelectItem>
                <SelectItem value="24h" className="focus:bg-white/10 focus:text-white cursor-pointer">Last 24 hours</SelectItem>
                <SelectItem value="7d" className="focus:bg-white/10 focus:text-white cursor-pointer">Last week</SelectItem>
                <SelectItem value="30d" className="focus:bg-white/10 focus:text-white cursor-pointer">Last month</SelectItem>
                <SelectItem value="1y" className="focus:bg-white/10 focus:text-white cursor-pointer">Last year</SelectItem>
                <SelectItem value="5y" className="focus:bg-white/10 focus:text-white cursor-pointer">Past 5 years</SelectItem>
                <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spending Card */}
          <div className="glass-panel p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                <CreditCard className="size-4" />
                Billing & Usage
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Spend this month</p>
                <p className="text-2xl font-semibold text-white">${totalSpend.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Active Plan</p>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center justify-center size-5 rounded bg-primary/20 text-primary shadow-[0_0_10px_rgba(245,181,23,0.2)]"><Zap className="size-3" /></span>
                  <p className="text-xl font-semibold text-primary drop-shadow-[0_0_10px_rgba(245,181,23,0.3)]">Pro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="glass-panel p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                <Activity className="size-4" />
                Performance
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Running Containers</p>
                <p className="text-2xl font-semibold text-white">{runningCount === null ? "—" : runningCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Requests / Min</p>
                <p className="text-2xl font-semibold text-white">4.2k</p>
              </div>
            </div>
          </div>

          {/* Traffic Card */}
          <div className="glass-panel p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                <Globe className="size-4" />
                Traffic
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Web Traffic</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-semibold text-white">1.92k</p>
                  <span className="text-xs text-emerald-400 font-medium mb-1">↗ 73.1%</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">Bandwidth</p>
                <p className="text-2xl font-semibold text-white">14.2<span className="text-sm text-white/50 ml-1">GB</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* Left column — Projects (like Cloudflare Domains) */}
        <div className="glass-panel flex flex-col h-full overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-sm font-medium text-white flex items-center">
              Projects
              <span className="ml-2 bg-white/10 text-[10px] font-bold py-0.5 px-2 rounded-full border border-white/10">{projects.length}</span>
            </h3>
            <button className="text-white/40 hover:text-white transition"><Plus className="size-4" /></button>
          </div>
          <div className="p-3 flex-1">
            {projects.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="mx-auto size-12 rounded-xl bg-white/5 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4">
                  <FolderKanban className="size-5 text-white/30" />
                </div>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  No projects yet.<br />Use the workspace switcher to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${username}/${project.slug}`}
                    className="flex items-center gap-3.5 rounded-xl px-3 py-3 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all group"
                  >
                    <div className="size-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <span className="flex-1 text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                      {project.name}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 bg-white/5 border border-white/10 rounded p-1">
                      <ArrowUpRight className="size-3 text-white/70" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle column — Promo Card (like Cloudflare Workers and Pages) */}
        <div className="glass-panel flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
            <Container className="size-16 text-primary drop-shadow-[0_0_15px_rgba(245,181,23,0.5)] relative z-10" strokeWidth={1} />
          </div>
          <h3 className="text-base font-semibold text-white mb-3">Build and scale apps globally</h3>
          <p className="text-[13px] text-white/50 mb-8 leading-relaxed max-w-[240px]">Deploy microservices, frontend applications, and databases with integrated compute and storage.</p>
          <button className="glass-surface px-5 py-2.5 rounded-lg text-[13px] font-medium text-white hover:bg-white/10 transition border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-2">
            Start building
          </button>
        </div>

        {/* Right column — Security/Platform Health (like Cloudflare Zero Trust) */}
        <div className="glass-panel flex flex-col h-full overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-sm font-medium text-white">Platform Health</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span className="text-[13px] text-white/70 group-hover:text-white transition">Network Security</span>
                </div>
                <span className="text-[13px] font-mono text-white">100%</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <Activity className="size-4 text-emerald-400" />
                  <span className="text-[13px] text-white/70 group-hover:text-white transition">API Gateway uptime</span>
                </div>
                <span className="text-[13px] font-mono text-white">99.99%</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <ServerCrash className="size-4 text-rose-400" />
                  <span className="text-[13px] text-white/70 group-hover:text-white transition">Failed Deployments</span>
                </div>
                <span className="text-[13px] font-mono text-white">2</span>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/30 mb-3">Recent Activity</p>
              <div className="space-y-3">
                {MOCK_ACTIVITY.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#141416] border border-white/10 mt-0.5 shrink-0">
                      {item.icon === "commit" && <GitCommit className="size-2.5 text-white/40" />}
                      {item.icon === "alert" && <AlertCircle className="size-2.5 text-rose-400" />}
                      {item.icon === "check" && <CheckCircle2 className="size-2.5 text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-white/80 leading-tight">{item.message}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-4 relative z-10 mt-12">
        <h2 className="text-sm font-medium text-white/90">Next steps</h2>
        <div className="glass-panel divide-y divide-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer group">
            <span className="text-[13px] text-white/80 font-medium group-hover:text-white transition">Enable two-factor authentication to improve login security</span>
            <ArrowRight className="size-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer group">
            <span className="text-[13px] text-white/80 font-medium group-hover:text-white transition">Invite teammates and back-up admins</span>
            <ArrowRight className="size-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer group">
            <span className="text-[13px] text-white/80 font-medium group-hover:text-white transition">Explore the developer documentation</span>
            <ArrowRight className="size-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

    </div>
  );
}
