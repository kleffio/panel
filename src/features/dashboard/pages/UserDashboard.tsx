"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  FolderKanban,
  Container,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  GitCommit,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Zap,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { listWorkloads } from "@/lib/api/projects";

// ── Mock billing data (replace with real API when billing is live) ──────────

const MOCK_TRANSACTIONS = [
  { id: "1", date: "Apr 15, 2026", description: "Container runtime — prod-api",    amount: 12.40,  status: "paid"    as const },
  { id: "2", date: "Apr 14, 2026", description: "Container runtime — auth-worker",  amount: 8.20,   status: "paid"    as const },
  { id: "3", date: "Apr 13, 2026", description: "Egress bandwidth",                 amount: 2.10,   status: "paid"    as const },
  { id: "4", date: "Apr 10, 2026", description: "Container runtime — redis-cache",  amount: 4.80,   status: "paid"    as const },
  { id: "5", date: "Apr 01, 2026", description: "Pro plan — April",                 amount: 20.00,  status: "paid"    as const },
];

const MOCK_ACTIVITY = [
  { icon: "check"  as const, message: "prod-api deployed successfully",        time: "12 min ago" },
  { icon: "alert"  as const, message: "API latency spiked to 450ms",           time: "24 min ago" },
  { icon: "check"  as const, message: "Database backup completed",             time: "4 hr ago"   },
  { icon: "commit" as const, message: "auth-worker scaled to 3 replicas",      time: "6 hr ago"   },
  { icon: "commit" as const, message: "redis-cache provisioned",               time: "Yesterday"  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function UserDashboard() {
  const auth = useAuth();
  const { projects, currentProjectID } = useCurrentProject();
  const [runningCount, setRunningCount] = useState<number | null>(null);

  const user = auth.user;
  const username = (user?.profile?.preferred_username as string | undefined)
    ?? (user?.profile?.sub as string | undefined)
    ?? "user";
  const displayName =
    user?.profile?.given_name ??
    (user?.profile?.name as string | undefined)?.split(" ")[0] ??
    username ??
    "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const totalSpend = MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);

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

  const metrics = [
    {
      label: "Spend this month",
      value: `$${totalSpend.toFixed(2)}`,
      caption: "+$8.30 from last month",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      label: "Active projects",
      value: String(projects.length),
      caption: projects.length === 1 ? "1 project" : `${projects.length} projects`,
      trend: null,
      icon: FolderKanban,
    },
    {
      label: "Running containers",
      value: runningCount === null ? "—" : String(runningCount),
      caption: "Across all projects",
      trend: null,
      icon: Container,
    },
    {
      label: "Requests / min",
      value: "4.2k",
      caption: "+12% from last hour",
      trend: "up" as const,
      icon: Activity,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-semibold tracking-tight capitalize">{displayName}</h1>
        </div>
        <span className="text-xs text-muted-foreground pt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <m.icon className="size-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{m.value}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {m.trend === "up" && <TrendingUp className="size-3 text-primary" />}
              {m.trend === "down" && <TrendingDown className="size-3 text-destructive" />}
              {m.caption}
            </p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Spending + Transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Spending overview */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Spending Overview
              </h2>
              <span className="text-xs text-muted-foreground">April 2026</span>
            </div>
            <div className="px-6 py-5">
              {/* Simple bar chart — placeholder */}
              <div className="flex items-end gap-1.5 h-24 mb-3">
                {[18, 32, 24, 40, 28, 47.50, 35].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="rounded-t-sm bg-primary/30 hover:bg-primary/50 transition-colors cursor-default"
                      style={{ height: `${(v / 50) * 100}%` }}
                      title={`$${v}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                  <span key={d} className="flex-1 text-center">{d}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">This month</p>
                  <p className="font-semibold text-foreground">${totalSpend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Plan</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Zap className="size-3 text-primary" /> Pro
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Next invoice</p>
                  <p className="font-semibold text-foreground">May 1, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Transaction History</h2>
              <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="size-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {MOCK_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-500">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Project health + Activity */}
        <div className="space-y-6">

          {/* Project health */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Projects</h2>
            </div>
            <div className="p-4 space-y-2">
              {projects.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No projects yet — use the workspace switcher to create one.
                </div>
              ) : (
                projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/project/${username}/${project.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/40 transition-colors group"
                  >
                    <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Recent Activity</h2>
            </div>
            <div className="p-4 space-y-4">
              {MOCK_ACTIVITY.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {item.icon === "commit" && <GitCommit className="size-4 text-muted-foreground mt-0.5 shrink-0" />}
                  {item.icon === "alert"  && <AlertCircle className="size-4 text-amber-500 mt-0.5 shrink-0" />}
                  {item.icon === "check"  && <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-sm text-foreground leading-snug">{item.message}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" /> {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
