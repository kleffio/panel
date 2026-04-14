import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import type { DetailPanelData, DetailSection } from "@/features/hosting/model/types";
import { TEST_ROUTES } from "@/lib/config/routes";
import { Badge } from "@kleffio/ui";
import { Button } from "@kleffio/ui";

export const HOSTING_DETAIL_PAGE_CONFIG = {
  layout: {
    maxWidth: 1480,
    paddingX: "px-4 sm:px-6 lg:px-8",
    paddingY: "py-7",
    heroGap: "gap-5",
    contentCardPadding: "p-6",
  },
  hero: {
    badgeGap: "gap-2",
    titleSize: "text-4xl sm:text-5xl",
    descriptionSpacing: "mt-3",
    descriptionMaxWidth: "max-w-4xl",
    actionGap: "gap-3",
    sectionMarginBottom: "mb-6",
  },
  stats: {
    gridGap: "gap-3",
    cardRadius: "rounded-[18px]",
    cardPadding: "p-4",
    labelSpacing: "mb-1.5",
    labelTracking: "tracking-[0.12em]",
    sectionMarginBottom: "mb-5",
  },
  panels: {
    splitGap: "gap-4",
    panelRadius: "rounded-[20px]",
    panelHeaderPadding: "px-4 py-3.5",
    panelBodyPadding: "p-4",
    panelRowGap: "gap-2",
    rowRadius: "rounded-2xl",
    rowPadding: "p-4",
    logTimeWidth: "min-w-[52px]",
  },
  attached: {
    headerMarginBottom: "mb-3",
    listGap: "gap-3",
    itemRadius: "rounded-[18px]",
    itemPadding: "p-4",
    actionGap: "gap-2",
  },
} as const;

function DetailPanel({ panel, logStyle = false }: { panel: DetailPanelData; logStyle?: boolean }) {
  return (
    <div className={`overflow-hidden ${HOSTING_DETAIL_PAGE_CONFIG.panels.panelRadius} border border-[var(--test-border)] bg-[var(--test-panel-muted)]`}>
      <div className={`flex items-center justify-between gap-3 border-b border-[var(--test-border)] bg-white/4 ${HOSTING_DETAIL_PAGE_CONFIG.panels.panelHeaderPadding}`}>
        <h3 className="text-sm font-semibold">{panel.title}</h3>
        <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
          {panel.badge}
        </Badge>
      </div>
      <div className={`grid ${HOSTING_DETAIL_PAGE_CONFIG.panels.panelRowGap} ${HOSTING_DETAIL_PAGE_CONFIG.panels.panelBodyPadding} ${logStyle ? "font-mono text-[13px] text-[var(--test-foreground)]" : ""}`}>
        {panel.rows.map((row) => (
          <div
            key={`${row.primary}-${row.secondary}`}
            className={
              logStyle
                ? "flex gap-3"
                : `flex flex-col gap-3 ${HOSTING_DETAIL_PAGE_CONFIG.panels.rowRadius} border border-[var(--test-border)] bg-[var(--test-panel-soft)] ${HOSTING_DETAIL_PAGE_CONFIG.panels.rowPadding} sm:flex-row sm:items-center sm:justify-between`
            }
          >
            <div>
              <strong className={`${logStyle ? `${HOSTING_DETAIL_PAGE_CONFIG.panels.logTimeWidth} font-normal text-[var(--test-muted)]` : "block text-sm"}`}>
                {row.primary}
              </strong>
              <span className={`${logStyle ? "" : "mt-1 block text-sm text-[var(--test-muted)]"}`}>
                {row.secondary}
              </span>
            </div>
            {!logStyle && row.meta ? (
              <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                {row.meta}
              </Badge>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HostingDetailPage({ section }: { section: DetailSection }) {
  return (
    <div
      className={`mx-auto ${HOSTING_DETAIL_PAGE_CONFIG.layout.paddingX} ${HOSTING_DETAIL_PAGE_CONFIG.layout.paddingY} space-y-6`}
      style={{ maxWidth: HOSTING_DETAIL_PAGE_CONFIG.layout.maxWidth }}
    >
            <section className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.sectionMarginBottom} flex flex-col ${HOSTING_DETAIL_PAGE_CONFIG.layout.heroGap} lg:flex-row lg:items-start lg:justify-between`}>
              <div>
                <div className={`mb-3 flex flex-wrap ${HOSTING_DETAIL_PAGE_CONFIG.hero.badgeGap}`}>
                  <Badge className="border-[color:var(--test-success)]/20 bg-[var(--test-success-soft)] text-[var(--test-success)]">
                    {section.label}
                  </Badge>
                  {section.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                      {badge}
                    </Badge>
                  ))}
                </div>
                <h1 className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.titleSize} font-semibold tracking-tight`}>{section.title}</h1>
                <p className={`${HOSTING_DETAIL_PAGE_CONFIG.hero.descriptionSpacing} ${HOSTING_DETAIL_PAGE_CONFIG.hero.descriptionMaxWidth} text-sm leading-7 text-[var(--test-muted)] sm:text-base`}>{section.description}</p>
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

            <div className={`overflow-hidden rounded-[1.6rem] border border-[var(--test-border)] bg-[var(--test-panel)] shadow-[var(--test-shadow)] ${HOSTING_DETAIL_PAGE_CONFIG.layout.contentCardPadding}`}>
              <div className={`${HOSTING_DETAIL_PAGE_CONFIG.stats.sectionMarginBottom} grid ${HOSTING_DETAIL_PAGE_CONFIG.stats.gridGap} lg:grid-cols-4`}>
                {section.stats.map((stat) => (
                  <div key={stat.label} className={`${HOSTING_DETAIL_PAGE_CONFIG.stats.cardRadius} border border-[var(--test-border)] bg-[var(--test-panel-soft)] ${HOSTING_DETAIL_PAGE_CONFIG.stats.cardPadding}`}>
                    <span className={`${HOSTING_DETAIL_PAGE_CONFIG.stats.labelSpacing} block text-[11px] uppercase ${HOSTING_DETAIL_PAGE_CONFIG.stats.labelTracking} text-[var(--test-muted)]`}>
                      {stat.label}
                    </span>
                    <strong className="text-lg font-semibold">{stat.value}</strong>
                  </div>
                ))}
              </div>

              <div className={`${HOSTING_DETAIL_PAGE_CONFIG.stats.sectionMarginBottom} grid ${HOSTING_DETAIL_PAGE_CONFIG.panels.splitGap} lg:grid-cols-[1.1fr_0.9fr]`}>
                <DetailPanel panel={section.leftPanel} logStyle />
                <DetailPanel panel={section.rightPanel} />
              </div>

              <div className={`${HOSTING_DETAIL_PAGE_CONFIG.attached.headerMarginBottom} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
                <h2 className="text-base font-semibold">{section.attachedTitle}</h2>
                <Badge variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]">
                  {section.attachedBadge}
                </Badge>
              </div>

              <div className={`grid ${HOSTING_DETAIL_PAGE_CONFIG.attached.listGap}`}>
                {section.attached.map((item) => (
                  <div key={item.name} className={`flex flex-col gap-4 ${HOSTING_DETAIL_PAGE_CONFIG.attached.itemRadius} border border-[var(--test-border)] bg-[var(--test-panel-soft)] ${HOSTING_DETAIL_PAGE_CONFIG.attached.itemPadding} sm:flex-row sm:items-center sm:justify-between`}>
                    <div>
                      <strong className="block text-sm">{item.name}</strong>
                      <p className="mt-1 text-sm leading-6 text-[var(--test-muted)]">{item.description}</p>
                    </div>
                    <div className={`flex flex-wrap ${HOSTING_DETAIL_PAGE_CONFIG.attached.actionGap}`}>
                      <Badge className="border-[color:var(--test-success)]/20 bg-[var(--test-success-soft)] text-[var(--test-success)]">
                        {item.status}
                      </Badge>
                      {item.href ? (
                        <Button asChild variant="outline" className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10">
                          <Link href={item.href}>
                            Manage
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
    </div>
  );
}
