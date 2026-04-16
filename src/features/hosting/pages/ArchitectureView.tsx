import { InfrastructureFlowCanvas } from "@/features/hosting/ui/InfrastructureFlowCanvas";
import { ArchitectureThemeShell } from "@/components/layout/ArchitectureThemeShell";
import type {
  InfrastructureEdge,
  InfrastructureNode,
} from "@/features/hosting/model/types";

export function ArchitectureView({
  infrastructureNodes,
  infrastructureEdges,
  projectID,
  projectName,
  activeServerNames,
  onRequestRefresh,
  onDeleteEdge,
  onDeleteNode,
  onPersistNodePosition,
  simulateMetrics,
}: {
  infrastructureNodes: InfrastructureNode[];
  infrastructureEdges: InfrastructureEdge[];
  projectID?: string | null;
  projectName?: string;
  activeServerNames?: string[];
  onRequestRefresh?: () => void;
  onDeleteEdge?: (edgeID: string) => Promise<void> | void;
  onDeleteNode?: (nodeID: string) => Promise<void> | void;
  onPersistNodePosition?: (nodeID: string, position: { x: number; y: number }) => void;
  simulateMetrics?: boolean;
}) {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] min-h-[720px] overflow-hidden">
      <ArchitectureThemeShell>
        <InfrastructureFlowCanvas
          infrastructureNodes={infrastructureNodes}
          infrastructureEdges={infrastructureEdges}
          projectID={projectID}
          projectName={projectName}
          activeServerNames={activeServerNames}
          onRequestRefresh={onRequestRefresh}
          onDeleteEdge={onDeleteEdge}
          onDeleteNode={onDeleteNode}
          onPersistNodePosition={onPersistNodePosition}
          simulateMetrics={simulateMetrics}
        />
      </ArchitectureThemeShell>
    </div>
  );
}
