import "server-only";

import { simulateRequest } from "@/lib/mock/request";
import {
  detailSections,
  gameServerDetailData,
  infrastructureEdges,
  infrastructureNodes,
  mockAiSuggestions,
  overviewActivityFeed,
  overviewDeployments,
  overviewMetricCards,
} from "@/features/hosting/model/content";
import type {
  DetailSection,
  GameServerDetailData,
  HostingPageKey,
  OverviewActivityItem,
  OverviewDeploymentItem,
  OverviewMetricCard,
} from "@/features/hosting/model/types";

export const hostingDetailSlugs = [
  "web",
  "server",
  "database",
  "cache",
  "proxy",
  "workers",
  "game-server",
  "observability",
] as const;

export async function getHostingOverviewPageData() {
  return simulateRequest({
    infrastructureNodes,
    mockAiSuggestions,
    overviewMetricCards,
    overviewDeployments,
    overviewActivityFeed,
  });
}

export async function getHostingArchitecturePageData() {
  return simulateRequest({
    infrastructureNodes: infrastructureNodes.map(({ icon: _icon, ...node }) => node),
    infrastructureEdges,
    mockAiSuggestions,
  });
}

export async function getHostingDetailPageData(slug: string): Promise<{
  section: DetailSection | null;
  gameServerDetailData: GameServerDetailData | null;
}> {
  if (slug === "game-server") {
    return simulateRequest({
      section: null,
      gameServerDetailData,
    });
  }

  const section = detailSections[slug as HostingPageKey];
  return simulateRequest({
    section: section ?? null,
    gameServerDetailData: null,
  });
}
