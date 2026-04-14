import type { Metadata } from "next";
import { getHostingOverviewPageData } from "@/features/hosting/server/loaders";
import { SystemOverviewDashboard } from "@/features/hosting/pages/SystemOverviewDashboard";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const data = await getHostingOverviewPageData();

  return (
    <SystemOverviewDashboard
      infrastructureNodes={data.infrastructureNodes}
      mockAiSuggestions={data.mockAiSuggestions}
      overviewMetricCards={data.overviewMetricCards}
      overviewDeployments={data.overviewDeployments}
      overviewActivityFeed={data.overviewActivityFeed}
    />
  );
}
