import { InfrastructureFlowCanvas } from "@/components/flow/InfrastructureFlowCanvas";
import { ArchitectureThemeShell } from "@/components/theme/ArchitectureThemeShell";
import type {
  AiSuggestion,
  InfrastructureEdge,
  InfrastructureNode,
} from "@/features/hosting/model/types";

export function ArchitectureView({
  infrastructureNodes,
  infrastructureEdges,
  mockAiSuggestions,
}: {
  infrastructureNodes: InfrastructureNode[];
  infrastructureEdges: InfrastructureEdge[];
  mockAiSuggestions: AiSuggestion[];
}) {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] min-h-[720px] overflow-hidden">
      <ArchitectureThemeShell>
        <InfrastructureFlowCanvas
          infrastructureNodes={infrastructureNodes}
          infrastructureEdges={infrastructureEdges}
          mockAiSuggestions={mockAiSuggestions}
        />
      </ArchitectureThemeShell>
    </div>
  );
}
