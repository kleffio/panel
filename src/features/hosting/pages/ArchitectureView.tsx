import { InfrastructureFlowCanvas } from "@/features/hosting/ui/InfrastructureFlowCanvas";
import { ArchitectureThemeShell } from "@/components/layout/ArchitectureThemeShell";
import type {
  AiSuggestion,
  InfrastructureEdge,
  InfrastructureNode,
} from "@/features/hosting/model/types";
import type { ConnectionDTO } from "@/lib/api";

export function ArchitectureView({
  infrastructureNodes,
  infrastructureEdges,
  mockAiSuggestions,
  projectID,
  projectName,
  activeServerNames,
  onRequestRefresh,
  onDeleteEdge,
  onDeleteNode,
  onPersistNodePosition,
  onCreateConnection,
  simulateMetrics,
}: {
  infrastructureNodes: InfrastructureNode[];
  infrastructureEdges: InfrastructureEdge[];
  mockAiSuggestions: AiSuggestion[];
  projectID?: string | null;
  projectName?: string;
  activeServerNames?: string[];
  onRequestRefresh?: () => void;
  onDeleteEdge?: (edgeID: string) => Promise<void> | void;
  onDeleteNode?: (nodeID: string) => Promise<void> | void;
  onPersistNodePosition?: (nodeID: string, position: { x: number; y: number }) => void;
  onCreateConnection?: (sourceID: string, targetID: string, kind: ConnectionDTO["kind"]) => Promise<void>;
  simulateMetrics?: boolean;
}) {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] min-h-[720px] overflow-hidden">
      <ArchitectureThemeShell>
        <InfrastructureFlowCanvas
          infrastructureNodes={infrastructureNodes}
          infrastructureEdges={infrastructureEdges}
          mockAiSuggestions={mockAiSuggestions}
          projectID={projectID}
          projectName={projectName}
          activeServerNames={activeServerNames}
          onRequestRefresh={onRequestRefresh}
          onDeleteEdge={onDeleteEdge}
          onDeleteNode={onDeleteNode}
          onPersistNodePosition={onPersistNodePosition}
          onCreateConnection={onCreateConnection}
          simulateMetrics={simulateMetrics}
        />
      </ArchitectureThemeShell>
    </div>
  );
}
