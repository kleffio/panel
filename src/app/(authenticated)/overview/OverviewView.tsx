import { SystemOverviewDashboard } from "@/features/hosting/ui/SystemOverviewDashboard";
import type {
  AiSuggestion,
  InfrastructureNode,
  OverviewActivityItem,
  OverviewDeploymentItem,
  OverviewMetricCard,
} from "@/features/hosting/model/types";

export function OverviewView({
  infrastructureNodes,
  mockAiSuggestions,
  overviewMetricCards,
  overviewDeployments,
  overviewActivityFeed,
}: {
  infrastructureNodes: InfrastructureNode[];
  mockAiSuggestions: AiSuggestion[];
  overviewMetricCards: OverviewMetricCard[];
  overviewDeployments: OverviewDeploymentItem[];
  overviewActivityFeed: OverviewActivityItem[];
}) {
  return (
    <SystemOverviewDashboard
      infrastructureNodes={infrastructureNodes}
      mockAiSuggestions={mockAiSuggestions}
      overviewMetricCards={overviewMetricCards}
      overviewDeployments={overviewDeployments}
      overviewActivityFeed={overviewActivityFeed}
    />
  );
}
