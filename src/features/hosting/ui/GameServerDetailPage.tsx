import {
  ArrowLeft,
  ChevronRight,
  Database,
  ExternalLink,
  FolderTree,
  Pencil,
  Server,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";

import { TEST_ROUTES } from "@/lib/config/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOSTING_DETAIL_PAGE_CONFIG } from "@/features/hosting/ui/HostingDetailPage";
import type { GameServerDetailData } from "@/features/hosting/model/types";

export function GameServerDetailPage({ data }: { data: GameServerDetailData }) {
  return (
    <div
      className={`mx-auto ${HOSTING_DETAIL_PAGE_CONFIG.layout.paddingX} ${HOSTING_DETAIL_PAGE_CONFIG.layout.paddingY} space-y-5`}
      style={{ maxWidth: 1300 }}
    >
            <section className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.sectionMarginBottom} flex flex-col ${HOSTING_DETAIL_PAGE_CONFIG.layout.heroGap} lg:flex-row lg:items-start lg:justify-between`}>
              <div>
                <div className={`mb-3 flex flex-wrap ${HOSTING_DETAIL_PAGE_CONFIG.hero.badgeGap}`}>
                  {data.badges.map((badge, index) => (
                    <Badge
                      key={badge}
                      variant={index === 0 ? "default" : "outline"}
                      className={index === 0 ? "border-[color:var(--test-success)]/20 bg-[var(--test-success-soft)] text-[var(--test-success)]" : "border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]"}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
                <h1 className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.titleSize} font-semibold tracking-tight`}>
                  {data.title}
                </h1>
                <p className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.descriptionSpacing} ${HOSTING_DETAIL_PAGE_CONFIG.hero.descriptionMaxWidth} text-sm leading-7 text-[var(--test-muted)] sm:text-base`}>
                  {data.description}
                </p>
              </div>

              <div className={`flex flex-wrap ${HOSTING_DETAIL_PAGE_CONFIG.hero.actionGap}`}>
                <Button asChild variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10">
                  <Link href={TEST_ROUTES.ROOT}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to architecture
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={TEST_ROUTES.DASHBOARD}>Back to dashboard</Link>
                </Button>
              </div>
            </section>

            <div className="overflow-hidden rounded-[1.6rem] border border-[var(--test-border)] bg-[var(--test-panel)] p-6 shadow-[var(--test-shadow)]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {data.resourceCards.map((card) => (
                  <div key={card.label} className="rounded-[18px] border border-[var(--test-border)] bg-[var(--test-panel-soft)] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
                        {card.label}
                      </span>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--test-muted)]"
                        aria-label={`Edit ${card.label.toLowerCase()}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <strong className="text-lg font-semibold">{card.value}</strong>
                    <p className="mt-2 text-sm text-[var(--test-muted)]">{card.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="overflow-hidden rounded-[20px] border border-[var(--test-border)] bg-[var(--test-panel-muted)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--test-border)] bg-white/4 px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <SquareTerminal className="h-4 w-4 text-[var(--test-accent)]" />
                      <h3 className="text-sm font-semibold">Live Console</h3>
                    </div>
                    <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                      Open
                    </Badge>
                  </div>
                  <div className="space-y-3 bg-[linear-gradient(180deg,rgba(9,16,23,0.96),rgba(13,20,26,0.96))] p-4 font-mono text-[13px] text-[var(--test-foreground)]">
                    {data.consoleLines.map((line) => (
                      <div key={`${line.time}-${line.tag}`} className="flex gap-3 leading-6">
                        <span className="min-w-[56px] text-[var(--test-muted)]">{line.time}</span>
                        <span className={line.tone}>{line.tag}</span>
                        <span>{line.message}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--test-border)] bg-white/5 px-4 py-3 font-mono text-sm text-[var(--test-muted)]">
                    &gt; say Server maintenance in 10 minutes
                  </div>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-[var(--test-border)] bg-[var(--test-panel-muted)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--test-border)] bg-white/4 px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-[var(--test-accent)]" />
                      <h3 className="text-sm font-semibold">Server Explorer</h3>
                    </div>
                    <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                      Synced
                    </Badge>
                  </div>
                  <div className="grid min-h-[320px] md:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="border-b border-[var(--test-border)] bg-black/10 p-4 md:border-b-0 md:border-r">
                      <div className="space-y-4">
                        {data.explorerGroups.map((group) => (
                          <div key={group.title} className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
                              {group.title}
                            </p>
                            <div className="grid gap-1.5">
                              {group.items.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-xl border border-white/6 bg-white/5 px-3 py-2 text-sm text-[var(--test-muted)]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="rounded-[18px] border border-[var(--test-border)] bg-[var(--test-panel-soft)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
                              Selected
                            </p>
                            <h4 className="mt-1 text-base font-semibold">{data.selectedFile.path}</h4>
                          </div>
                          <Button variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10">
                            Open
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/8 bg-black/12 p-4">
                            <p className="text-sm font-medium">Plugin Overview</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--test-muted)]">
                              {data.selectedFile.overview}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-black/12 p-4">
                            <p className="text-sm font-medium">Recent Change</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--test-muted)]">
                              {data.selectedFile.recentChange}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
                  Container Layout
                </span>
                <div className="mt-3 grid gap-3">
                  {data.containers.map((container) => (
                    <div
                      key={container.name}
                      className="grid gap-4 rounded-[18px] border border-[var(--test-border)] bg-[var(--test-panel-soft)] p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div>
                        <h4 className="text-[0.98rem] font-semibold">{container.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-[var(--test-muted)]">
                          {container.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {container.meta.map((item) => (
                            <Badge key={item} variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start justify-start md:justify-end">
                        <Badge className="border-[color:var(--test-success)]/20 bg-[var(--test-success-soft)] text-[var(--test-success)]">
                          {container.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[26px] border border-[var(--test-border)] bg-[linear-gradient(135deg,rgba(246,193,119,0.12),rgba(255,255,255,0.04))] p-5 shadow-[var(--test-shadow)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Attached Databases</h2>
                  <p className="mt-1 text-sm text-[var(--test-muted)]">
                    {data.attachedDatabasesDescription}
                  </p>
                </div>
                <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                  {data.attachedDatabasesBadge}
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {data.attachedDatabases.map((databaseItem) => (
                  <div key={databaseItem.name} className="rounded-[20px] border border-[var(--test-border)] bg-[var(--test-panel)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/6">
                          <Database className="h-5 w-5 text-[var(--test-foreground)]" />
                        </div>
                        <div>
                          <strong className="block text-sm">{databaseItem.name}</strong>
                          <p className="mt-1 text-sm leading-6 text-[var(--test-muted)]">
                            {databaseItem.description}
                          </p>
                        </div>
                      </div>
                      <Badge className="border-[color:var(--test-success)]/20 bg-[var(--test-success-soft)] text-[var(--test-success)]">
                        {databaseItem.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {databaseItem.badges.map((badge) => (
                        <Badge key={badge} variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                          {badge}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10">
                        Manage
                      </Button>
                      <Button asChild variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10">
                        <Link href={databaseItem.href}>
                          Open
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="border-rose-300/20 bg-rose-400/8 text-rose-100 hover:bg-rose-400/12">
                        Detach
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--test-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--test-border)] bg-[var(--test-panel)] px-3 py-2">
                <Server className="h-4 w-4" />
                {data.footerNote}
              </span>
            </div>
    </div>
  );
}
