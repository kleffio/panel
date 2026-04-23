"use client";

import { useEffect, useRef, useState } from "react";
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
  ServerCrash,
  Calendar,
  X,
  Loader2,
  ArrowRight,
  Search,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useCurrentProject } from "@/features/projects/model/CurrentProjectProvider";
import { createProject, listWorkloads } from "@/lib/api/projects";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Button,
} from "@kleffio/ui";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_ACTIVITY = [
  { icon: "check" as const, message: "prod-api deployed successfully", time: "12 min ago" },
  { icon: "alert" as const, message: "API latency spiked to 450ms", time: "24 min ago" },
  { icon: "check" as const, message: "Database backup completed", time: "4 hr ago" },
  { icon: "commit" as const, message: "auth-worker scaled to 3 replicas", time: "6 hr ago" },
  { icon: "commit" as const, message: "redis-cache provisioned", time: "Yesterday" },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── New Project Modal ──────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const project = await createProject({ name: name.trim(), slug: slug || slugify(name) });
      onCreated(project.slug);
    } catch {
      setError("Failed to create project. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md mx-4 animate-in slide-in-from-bottom-3 zoom-in-[0.97] duration-200">
        {/* Depth shadow ring */}
        <div className="absolute -inset-px rounded-[17px] bg-gradient-to-b from-white/[0.07] to-white/[0.02] pointer-events-none" />

        {/* Modal surface */}
        <div className="relative rounded-2xl overflow-hidden bg-background shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_48px_120px_rgba(0,0,0,0.95),0_16px_40px_rgba(0,0,0,0.6)]">

          {/* Top highlight edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-white/[0.02] border-b border-white/[0.05]">
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight">New Project</h2>
              <p className="text-[12px] text-white/35 mt-0.5">Create a workspace for your services and infrastructure.</p>
            </div>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Form body */}
          <div className="px-6 py-5 space-y-5 bg-white/[0.01]">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">Project Name</Label>
              <Input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                placeholder="My Project"
                className="bg-white/[0.03] border-white/[0.07] text-white placeholder:text-white/[0.18] focus-visible:border-white/20 focus-visible:ring-0 focus-visible:shadow-none focus-visible:bg-white/[0.04] h-10 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
                placeholder="my-project"
                className="bg-white/[0.03] border-white/[0.07] text-white/60 placeholder:text-white/[0.18] focus-visible:border-white/20 focus-visible:ring-0 focus-visible:shadow-none focus-visible:bg-white/[0.04] h-10 font-mono text-[13px] transition-colors"
              />
              <p className="text-[11px] text-white/25">Used in URLs. Auto-generated from the project name.</p>
            </div>
            {error && (
              <p className="text-[12px] text-rose-400 bg-rose-500/[0.08] border border-rose-500/[0.15] rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-white/[0.015] border-t border-white/[0.05]">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="text-white/40 hover:text-white/70 hover:bg-white/[0.05] h-9 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="bg-primary text-black hover:opacity-90 h-9 px-5 font-semibold shadow-[0_0_24px_rgba(245,181,23,0.2)] disabled:opacity-30 disabled:shadow-none transition-all"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AccountHomePage() {
  const auth = useAuth();
  const router = useRouter();
  const { projects, refreshProjects } = useCurrentProject();
  const [workloadCounts, setWorkloadCounts] = useState<Record<string, number> | null>(null);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [showModal, setShowModal] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  const user = auth.user;
  const username = (user?.profile?.preferred_username as string | undefined)
    ?? (user?.profile?.sub as string | undefined)
    ?? "user";
  const displayName =
    (user?.profile?.name as string | undefined)?.split(" ")[0]
    ?? user?.profile?.given_name
    ?? username;
  const accountName = `${displayName}'s Account`;

  const totalSpend = 47.50;

  useEffect(() => {
    if (projects.length === 0) { setWorkloadCounts({}); return; }
    Promise.all(projects.map((p) => listWorkloads(p.id).then((r) => ({ id: p.id, workloads: r.workloads ?? [] }))))
      .then((results) => {
        const counts: Record<string, number> = {};
        for (const { id, workloads } of results) {
          counts[id] = workloads.filter((w) => w.state === "running").length;
        }
        setWorkloadCounts(counts);
      })
      .catch(() => setWorkloadCounts({}));
  }, [projects]);

  const totalRunning = workloadCounts ? Object.values(workloadCounts).reduce((a, b) => a + b, 0) : null;

  async function handleProjectCreated(slug: string) {
    await refreshProjects();
    setShowModal(false);
    router.push(`/project/${username}/${slug}`);
  }

  const filteredProjects = projects.filter((p) =>
    !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.slug.includes(projectSearch.toLowerCase())
  );

  return (
    <>
      <div className="relative mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500 z-0 px-4 sm:px-6 lg:px-8 pb-16">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-kleff-grid [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_40%,transparent_100%)] opacity-20" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/8 blur-[130px]" />
        <div className="pointer-events-none absolute -right-32 top-96 -z-10 h-[20rem] w-[20rem] rounded-full bg-blue-500/4 blur-[100px]" />
        <div className="pointer-events-none absolute -left-32 top-[28rem] -z-10 h-[20rem] w-[20rem] rounded-full bg-violet-500/4 blur-[100px]" />

        {/* ── Header ── */}
        <div className="flex items-start justify-between relative z-10 pt-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">Account Home</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{accountName}</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black transition-all hover:opacity-90 shadow-[0_0_24px_rgba(245,181,23,0.25)] active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Project</span>
          </button>
        </div>

        {/* ── Analytics ── */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Analytics</h2>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[160px] h-8 bg-white/[0.03] border border-white/[0.07] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-[12px] font-medium focus:ring-1 focus:ring-primary/40 focus:border-primary/40">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-white/30" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0c] border border-white/[0.08] text-white shadow-xl">
                <SelectItem value="1h" className="focus:bg-white/10 focus:text-white cursor-pointer text-[13px]">Last hour</SelectItem>
                <SelectItem value="24h" className="focus:bg-white/10 focus:text-white cursor-pointer text-[13px]">Last 24 hours</SelectItem>
                <SelectItem value="7d" className="focus:bg-white/10 focus:text-white cursor-pointer text-[13px]">Last week</SelectItem>
                <SelectItem value="30d" className="focus:bg-white/10 focus:text-white cursor-pointer text-[13px]">Last month</SelectItem>
                <SelectItem value="1y" className="focus:bg-white/10 focus:text-white cursor-pointer text-[13px]">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Billing card */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col gap-5 group hover:border-white/[0.12] hover:bg-white/[0.035] transition-all duration-300">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                  <CreditCard className="size-3.5 text-emerald-400" />
                </span>
                <span className="text-[12px] font-medium text-white/50">Billing & Usage</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Spend this month</p>
                  <p className="text-[22px] font-semibold text-white tracking-tight">${totalSpend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Active Plan</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="flex size-5 items-center justify-center rounded bg-primary/15 border border-primary/20">
                      <Zap className="size-3 text-primary" />
                    </span>
                    <p className="text-lg font-semibold text-primary">Pro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance card */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col gap-5 group hover:border-white/[0.12] hover:bg-white/[0.035] transition-all duration-300">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/15">
                  <Activity className="size-3.5 text-blue-400" />
                </span>
                <span className="text-[12px] font-medium text-white/50">Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Running Containers</p>
                  <p className="text-[22px] font-semibold text-white tracking-tight">{totalRunning === null ? "—" : totalRunning}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Requests / Min</p>
                  <p className="text-[22px] font-semibold text-white tracking-tight">4.2k</p>
                </div>
              </div>
            </div>

            {/* Traffic card */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col gap-5 group hover:border-white/[0.12] hover:bg-white/[0.035] transition-all duration-300">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/15">
                  <Globe className="size-3.5 text-violet-400" />
                </span>
                <span className="text-[12px] font-medium text-white/50">Traffic</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Web Traffic</p>
                  <div className="flex items-end gap-1.5">
                    <p className="text-[22px] font-semibold text-white tracking-tight">1.92k</p>
                    <span className="text-[11px] text-emerald-400 font-semibold mb-0.5">↗73.1%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Bandwidth</p>
                  <p className="text-[22px] font-semibold text-white tracking-tight">14.2<span className="text-sm text-white/40 ml-1">GB</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Projects (centerpiece — Cloudflare-style) ── */}
        <div className="relative z-10">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-white">Projects</h3>
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-white/[0.07] border border-white/[0.07] text-[10px] font-bold text-white/60">
                  {projects.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {projects.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
                    <input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Filter projects..."
                      className="h-8 w-44 rounded-lg bg-white/[0.04] border border-white/[0.07] pl-8 pr-3 text-[12px] text-white/70 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                  </div>
                )}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 text-[12px] font-semibold text-primary hover:bg-primary/20 transition-all"
                >
                  <Plus className="size-3.5" />
                  New Project
                </button>
              </div>
            </div>

            {/* Projects list */}
            {filteredProjects.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto size-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <FolderKanban className="size-6 text-white/20" />
                </div>
                <p className="text-[14px] font-medium text-white/40">
                  {projectSearch ? "No projects match your filter." : "No projects yet."}
                </p>
                {!projectSearch && (
                  <p className="text-[12px] text-white/25 mt-1 mb-5">Create your first project to get started.</p>
                )}
                {!projectSearch && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black text-[13px] font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(245,181,23,0.2)]"
                  >
                    <Plus className="size-4" />
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">Project</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 w-20 text-center">Status</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 w-24 text-right">Containers</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 w-6" />
                </div>

                {/* Rows */}
                <div className="divide-y divide-white/[0.04]">
                  {filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${username}/${project.slug}`}
                      className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.025] transition-all group"
                    >
                      {/* Name + slug */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                          <FolderKanban className="size-3.5 text-white/30 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors truncate">{project.name}</p>
                          <p className="text-[11px] text-white/30 font-mono truncate">{project.slug}</p>
                        </div>
                        {project.is_default && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary/80">
                            Default
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="hidden sm:flex items-center justify-center w-20">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15">
                          <div className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                        </div>
                      </div>

                      {/* Containers */}
                      <div className="hidden sm:flex items-center justify-end w-24">
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Container className="size-3.5" />
                          <span className="text-[12px] font-medium tabular-nums">
                            {workloadCounts === null ? "—" : (workloadCounts[project.id] ?? 0)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-end w-6">
                        <ArrowUpRight className="size-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom row: Platform Health + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">

          {/* Platform Health (wider) */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-semibold text-white">Platform Health</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, label: "Network Security", value: "100%", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15", valueColor: "text-emerald-400" },
                { icon: Activity, label: "API Gateway uptime", value: "99.99%", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15", valueColor: "text-emerald-400" },
                { icon: ServerCrash, label: "Failed Deployments", value: "2", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/15", valueColor: "text-rose-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3">
                  <span className={`flex size-7 items-center justify-center rounded-md border ${item.bg}`}>
                    <item.icon className={`size-3.5 ${item.color}`} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{item.label}</p>
                    <p className={`text-2xl font-semibold tracking-tight font-mono ${item.valueColor}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="p-4">
              <div className="relative space-y-4 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-white/10 before:via-white/[0.06] before:to-transparent">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div key={i} className="relative flex gap-3.5 items-start group">
                    <div className="relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#0c0c0f] border border-white/[0.09] group-hover:border-white/20 transition-colors mt-0.5">
                      {item.icon === "commit" && <GitCommit className="size-3 text-white/30" />}
                      {item.icon === "alert" && <AlertCircle className="size-3 text-rose-400" />}
                      {item.icon === "check" && <CheckCircle2 className="size-3 text-emerald-400" />}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[12px] font-medium text-white/70 leading-snug group-hover:text-white/90 transition-colors">{item.message}</p>
                      <p className="text-[10px] font-medium text-white/30 mt-1 uppercase tracking-wider">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Next Steps ── */}
        <div className="space-y-3 relative z-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Next steps</h2>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.05]">
            {[
              { label: "Enable two-factor authentication to improve login security", href: "/account/security" },
              { label: "Invite teammates and back-up admins", href: "/account/profile" },
              { label: "Explore the developer documentation", href: "#" },
            ].map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.025] transition-colors group"
              >
                <span className="text-[13px] text-white/60 font-medium group-hover:text-white/90 transition-colors">{step.label}</span>
                <ArrowRight className="size-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── New Project Modal ── */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </>
  );
}
