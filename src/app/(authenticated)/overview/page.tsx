import type { Metadata } from "next";
import { getHostingOverviewPageData } from "@/features/hosting/server/loaders";
import { OverviewView } from "./OverviewView";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const data = await getHostingOverviewPageData();

  return (
    <OverviewView
      infrastructureNodes={data.infrastructureNodes}
      mockAiSuggestions={data.mockAiSuggestions}
      overviewMetricCards={data.overviewMetricCards}
      overviewDeployments={data.overviewDeployments}
      overviewActivityFeed={data.overviewActivityFeed}
    />
  );
}
