"use client";

import "reactflow/dist/style.css";

import { motion } from "framer-motion";
import { Plus, Radar, Waypoints } from "lucide-react";
import { useEffect } from "react";
import type { EdgeTypes, NodeTypes } from "reactflow";
import {
  Background,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";

import { useInfrastructureFlowWorkspace } from "@/features/hosting/model/useInfrastructureFlowWorkspace";
import {
  INFRASTRUCTURE_EDGE_TYPE,
  INFRASTRUCTURE_NODE_TYPE,
} from "@/lib/infrastructure-graph";
import { Button } from "@kleffio/ui";
import { toast } from "sonner";
import { AnalyzeSystemButton } from "@/components/flow/AnalyzeSystemButton";
import { EdgeConnection } from "@/components/flow/EdgeConnection";
import { InfrastructureNodeCard } from "@/components/flow/InfrastructureNodeCard";
import { NodeDetailsPanel } from "@/components/flow/NodeDetailsPanel";
import type { AiSuggestion, InfrastructureEdge, InfrastructureNode } from "@/features/hosting/model/types";

const nodeTypes: NodeTypes = {
  [INFRASTRUCTURE_NODE_TYPE]: InfrastructureNodeCard,
};

const edgeTypes: EdgeTypes = {
  [INFRASTRUCTURE_EDGE_TYPE]: EdgeConnection,
};

function FlowCanvasBody({
  infrastructureNodes,
  infrastructureEdges,
  mockAiSuggestions,
}: {
  infrastructureNodes: InfrastructureNode[];
  infrastructureEdges: InfrastructureEdge[];
  mockAiSuggestions: AiSuggestion[];
}) {
  const { fitView } = useReactFlow();
  const {
    analysisActive,
    activeSuggestions,
    closePanel,
    flowEdges,
    flowNodes,
    handleAnalyzeSystem,
    handleNodeAction,
    handleNodeClick,
    handleNodeDrag,
    handleNodeDragStop,
    handleOrganizeCanvas,
    handlePaneClick,
    isAnalyzing,
    onNodesChange,
    relatedNodes,
    selectedNode,
    selectedNodeSuggestions,
    setHoveredNodeId,
    setViewport,
    viewport,
  } = useInfrastructureFlowWorkspace({
    initialInfrastructureNodes: infrastructureNodes,
    initialInfrastructureEdges: infrastructureEdges,
    initialMockAiSuggestions: mockAiSuggestions,
  });

  const issueCount = activeSuggestions.length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.repeat || event.key.toLowerCase() !== "c") {
        return;
      }

      fitView({ padding: 0.18, maxZoom: 1.1, duration: 450 });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fitView]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
        panOnScroll={false}
        panOnDrag
        zoomOnDoubleClick={false}
        elevateEdgesOnSelect
        minZoom={0.5}
        maxZoom={2}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        onMove={(_, nextViewport) => setViewport(nextViewport)}
        className="bg-transparent"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--test-overlay-dot)" gap={28} size={1.3} />

        <Panel position="top-left" className="!m-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-2xl border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)] hover:bg-[var(--test-accent-soft)]"
            onClick={() => {
              handleOrganizeCanvas();
              window.setTimeout(() => {
                fitView({ padding: 0.22, maxZoom: 1.05, duration: 420 });
              }, 240);
            }}
          >
            <Waypoints className="h-4 w-4" />
            Organize
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-2xl border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)] hover:bg-[var(--test-accent-soft)]"
            onClick={() =>
              toast("Node creation mocked", {
                description: "The visual add-node flow is staged for the next interactive pass.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add Node
          </Button>
          <AnalyzeSystemButton
            active={analysisActive}
            issueCount={issueCount}
            isAnalyzing={isAnalyzing}
            onClick={handleAnalyzeSystem}
          />
        </Panel>

        <Panel position="top-right" className="!m-4 flex w-[320px] flex-col gap-3">
          {analysisActive ? (
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.7rem] border border-amber-300/20 bg-[rgba(47,34,14,0.84)] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-100">AI findings</p>
                  <p className="text-xs text-amber-50/70">{activeSuggestions.length} recommendations</p>
                </div>
                <span className="rounded-full border border-amber-300/20 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-100">
                  active
                </span>
              </div>

              <div className="space-y-2">
                {activeSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-2xl border border-white/8 bg-black/12 p-3"
                  >
                    <p className="text-sm font-medium text-[var(--test-foreground)]">
                      {suggestion.title}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-[var(--test-muted)]">
                      {suggestion.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </Panel>

        <Panel position="bottom-left" className="!m-4">
          <div className="rounded-full border border-[var(--test-border)] bg-[var(--test-panel)] px-4 py-2 text-xs text-[var(--test-muted)] backdrop-blur-lg">
            Scroll to zoom, drag empty canvas to pan, press C to center, right-click nodes for actions, click a node to inspect it.
          </div>
        </Panel>

        <Panel position="bottom-right" className="!m-4">
          <div className="rounded-2xl border border-[var(--test-border)] bg-[var(--test-panel)] px-4 py-2 text-sm text-[var(--test-muted)] backdrop-blur-lg">
            Zoom {viewport.zoom.toFixed(2)}x
          </div>
        </Panel>
      </ReactFlow>

      {selectedNode ? (
        <NodeDetailsPanel
          node={selectedNode}
          open
          onOpenChange={closePanel}
          onAction={handleNodeAction}
          relatedNodes={relatedNodes}
          suggestions={selectedNodeSuggestions}
        />
      ) : null}
    </div>
  );
}

export function InfrastructureFlowCanvas({
  infrastructureNodes,
  infrastructureEdges,
  mockAiSuggestions,
}: {
  infrastructureNodes: InfrastructureNode[];
  infrastructureEdges: InfrastructureEdge[];
  mockAiSuggestions: AiSuggestion[];
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvasBody
        infrastructureNodes={infrastructureNodes}
        infrastructureEdges={infrastructureEdges}
        mockAiSuggestions={mockAiSuggestions}
      />
    </ReactFlowProvider>
  );
}
