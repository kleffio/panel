"use client";

import "reactflow/dist/style.css";

import { motion } from "framer-motion";
import {
  BookmarkPlus,
  FolderOpen,
  LayersIcon as Layers,
  LayoutGrid,
  Network,
  Plus,
  Trash2,
  Waypoints,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Edge, EdgeTypes, Node, NodeChange, NodeTypes } from "reactflow";
import {
  Panel,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
} from "reactflow";

import { useInfrastructureFlowWorkspace } from "@/features/hosting/model/useInfrastructureFlowWorkspace";
import {
  INFRASTRUCTURE_EDGE_TYPE,
  INFRASTRUCTURE_NODE_TYPE,
} from "@/features/hosting/lib/infrastructure-graph";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@kleffio/ui";
import { toast } from "sonner";
import { AnalyzeSystemButton } from "./AnalyzeSystemButton";
import { EdgeConnection } from "./EdgeConnection";
import { GroupNode, GROUP_COLORS } from "./GroupNode";
import { GroupManagerModal } from "./GroupManagerModal";
import { InfrastructureNodeCard } from "./InfrastructureNodeCard";
import { NewServerSheet } from "./NewServerSheet";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import type { GroupNodeData } from "./GroupNode";
import type { GroupFormData } from "./GroupManagerModal";
import type { AiSuggestion, InfrastructureEdge, InfrastructureNode } from "@/features/hosting/model/types";
import type { ConnectionDTO } from "@/lib/api";

const nodeTypes: NodeTypes = {
  [INFRASTRUCTURE_NODE_TYPE]: InfrastructureNodeCard,
  group: GroupNode,
};

const edgeTypes: EdgeTypes = {
  [INFRASTRUCTURE_EDGE_TYPE]: EdgeConnection,
};

// ── Saved layouts (localStorage) ──────────────────────────────────────────────

interface SavedLayout {
  id: string;
  name: string;
  positions: Record<string, { x: number; y: number }>;
  savedAt: string;
}

function loadLayouts(projectID: string): SavedLayout[] {
  try {
    const raw = localStorage.getItem(`kleff:layouts:${projectID}`);
    return raw ? (JSON.parse(raw) as SavedLayout[]) : [];
  } catch {
    return [];
  }
}

function saveLayouts(projectID: string, layouts: SavedLayout[]) {
  localStorage.setItem(`kleff:layouts:${projectID}`, JSON.stringify(layouts));
}

// ── Main canvas body ───────────────────────────────────────────────────────────

function FlowCanvasBody({
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
  const { fitView } = useReactFlow();
  const [newServerOpen, setNewServerOpen] = useState(false);
  const [layouts, setLayouts] = useState<SavedLayout[]>(() =>
    projectID ? loadLayouts(projectID) : [],
  );
  const [saveNamePrompt, setSaveNamePrompt] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const refreshTimersRef = useRef<number[]>([]);
  const [groupNodes, setGroupNodes] = useState<Node<GroupNodeData>[]>([]);
  const groupNodesRef = useRef<Node<GroupNodeData>[]>([]);
  groupNodesRef.current = groupNodes;
  const groupColorRef = useRef(0);
  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    editId: string | null;
    initialData?: GroupFormData;
  }>({ open: false, mode: "create", editId: null });
  const groupModalRef = useRef(groupModal);
  groupModalRef.current = groupModal;

  const {
    analysisActive,
    activeSuggestions,
    applyPositions,
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
    simulateMetrics,
    onDeleteNode,
  });

  const issueCount = activeSuggestions.length;
  const flowNodesRef = useRef(flowNodes);
  flowNodesRef.current = flowNodes;

  const handleDeleteGroup = useCallback((id: string) => {
    setGroupNodes((ns) => ns.filter((n) => n.id !== id));
  }, []);

  const handleEditGroup = useCallback((id: string) => {
    const target = groupNodesRef.current.find((node) => node.id === id);
    if (!target) return;
    setGroupModal({
      open: true,
      mode: "edit",
      editId: id,
      initialData: {
        label: target.data.label,
        color: target.data.color,
        memberIds: target.data.memberIds,
        notes: target.data.notes ?? "",
        role: target.data.role ?? "",
      },
    });
  }, []);

  const handleCreateGroup = useCallback(() => {
    const color = GROUP_COLORS[groupColorRef.current % GROUP_COLORS.length];
    groupColorRef.current += 1;
    setGroupModal({
      open: true,
      mode: "create",
      editId: null,
      initialData: { label: "New Group", color, memberIds: [], notes: "", role: "" },
    });
  }, []);

  const handleConfirmGroup = useCallback(
    (formData: GroupFormData) => {
      setGroupModal((prev) => {
        if (prev.mode === "edit" && prev.editId) {
          const editId = prev.editId;
          setGroupNodes((ns) =>
            ns.map((node) =>
              node.id === editId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      label: formData.label,
                      color: formData.color,
                      memberIds: formData.memberIds,
                      memberCount: formData.memberIds.length,
                      notes: formData.notes,
                      role: formData.role,
                    },
                  }
                : node,
            ),
          );
        } else {
          // Create new group — auto-size to member bounding box or default
          const id = `group-${Date.now()}`;
          let position = { x: 80, y: 80 };
          let width = 380;
          let height = 280;

          if (formData.memberIds.length > 0) {
            const memberNodes = flowNodesRef.current.filter((n) => formData.memberIds.includes(n.id));
            if (memberNodes.length > 0) {
              const PAD = 48;
              const xs = memberNodes.map((n) => n.position.x);
              const ys = memberNodes.map((n) => n.position.y);
              const x2s = memberNodes.map((n) => n.position.x + (n.width ?? 220));
              const y2s = memberNodes.map((n) => n.position.y + (n.height ?? 90));
              const minX = Math.min(...xs) - PAD;
              const minY = Math.min(...ys) - PAD - 36; // 36px for label bar
              const maxX = Math.max(...x2s) + PAD;
              const maxY = Math.max(...y2s) + PAD;
              position = { x: minX, y: minY };
              width = Math.max(380, maxX - minX);
              height = Math.max(280, maxY - minY);
            }
          }

          setGroupNodes((ns) => [
            ...ns,
            {
              id,
              type: "group",
              position,
              style: { width, height },
              data: {
                label: formData.label,
                color: formData.color,
                memberIds: formData.memberIds,
                memberCount: formData.memberIds.length,
                avgCpu: null,
                computedStatus: null,
                notes: formData.notes,
                role: formData.role,
                onDelete: handleDeleteGroup,
                onEdit: handleEditGroup,
              },
              draggable: true,
              selectable: true,
              zIndex: -1,
            },
          ]);
          toast.success(`Group "${formData.label}" created`);
        }
        return { ...prev, open: false };
      });
    },
    [handleDeleteGroup, handleEditGroup],
  );

  const groupNodeIds = useMemo(() => new Set(groupNodes.map((n) => n.id)), [groupNodes]);

  const handleAllNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const infraChanges = changes.filter((c) => !groupNodeIds.has((c as { id: string }).id));
      const groupChanges = changes.filter((c) => groupNodeIds.has((c as { id: string }).id));
      if (infraChanges.length) onNodesChange(infraChanges);
      if (groupChanges.length) setGroupNodes((ns) => applyNodeChanges(groupChanges, ns) as Node<GroupNodeData>[]);
    },
    [groupNodeIds, onNodesChange],
  );

  const requestRefreshBurst = useCallback(() => {
    onRequestRefresh?.();
    for (const delay of [1000, 2500, 5000, 8000, 12000, 18000]) {
      const timerID = window.setTimeout(() => { onRequestRefresh?.(); }, delay);
      refreshTimersRef.current.push(timerID);
    }
  }, [onRequestRefresh]);

  const handleEdgesDelete = useCallback(
    (edges: Edge[]) => {
      if (!onDeleteEdge || edges.length === 0) return;
      void (async () => {
        let failedCount = 0;
        for (const edge of edges) {
          try { await onDeleteEdge(edge.id); } catch { failedCount += 1; }
        }
        if (failedCount === 0) {
          toast.success("Connection removed", {
            description: `${edges.length} connection${edges.length === 1 ? "" : "s"} disconnected.`,
          });
          onRequestRefresh?.();
          return;
        }
        toast.error("Some connections failed to disconnect");
        onRequestRefresh?.();
      })();
    },
    [onDeleteEdge, onRequestRefresh],
  );

  // ── Layout helpers ───────────────────────────────────────────────────────────

  const handleSaveLayout = useCallback(() => {
    if (!projectID || !newLayoutName.trim()) return;
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of flowNodes) {
      positions[node.id] = { x: node.position.x, y: node.position.y };
    }
    const newLayout: SavedLayout = {
      id: `${Date.now()}`,
      name: newLayoutName.trim(),
      positions,
      savedAt: new Date().toISOString(),
    };
    const updated = [...layouts, newLayout];
    setLayouts(updated);
    saveLayouts(projectID, updated);
    setNewLayoutName("");
    setSaveNamePrompt(false);
    toast.success(`Layout "${newLayout.name}" saved`);
  }, [projectID, newLayoutName, layouts, flowNodes]);

  const handleLoadLayout = useCallback(
    (layout: SavedLayout) => {
      applyPositions(layout.positions);
      // Persist updated positions to DB in background
      for (const [nodeID, pos] of Object.entries(layout.positions)) {
        onPersistNodePosition?.(nodeID, pos);
      }
      window.setTimeout(() => {
        fitView({ padding: 0.18, maxZoom: 1.1, duration: 450 });
      }, 260);
      toast.success(`Layout "${layout.name}" loaded`);
    },
    [applyPositions, onPersistNodePosition, fitView],
  );

  const handleDeleteLayout = useCallback(
    (layoutID: string) => {
      if (!projectID) return;
      const updated = layouts.filter((l) => l.id !== layoutID);
      setLayouts(updated);
      saveLayouts(projectID, updated);
    },
    [projectID, layouts],
  );

  const handleAutoOrganize = useCallback(() => {
    handleOrganizeCanvas();
    window.setTimeout(() => {
      fitView({ padding: 0.22, maxZoom: 1.05, duration: 420 });
    }, 240);
  }, [handleOrganizeCanvas, fitView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (event.repeat || event.key.toLowerCase() !== "c") return;
      fitView({ padding: 0.18, maxZoom: 1.1, duration: 450 });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [fitView]);

  useEffect(() => {
    return () => {
      for (const timerID of refreshTimersRef.current) { window.clearTimeout(timerID); }
      refreshTimersRef.current = [];
    };
  }, []);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <ReactFlow
        nodes={[...groupNodes, ...flowNodes]}
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
        onNodesChange={handleAllNodesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={(event, node, nodes) => {
          handleNodeDragStop(event, node, nodes);
          onPersistNodePosition?.(node.id, node.position);
        }}
        onPaneClick={handlePaneClick}
        onEdgesDelete={handleEdgesDelete}
        onMove={(_, nextViewport) => setViewport(nextViewport)}
          className="bg-transparent"
        proOptions={{ hideAttribution: true }}
      >
        {/* Top-left toolbar */}
        <Panel position="top-left" className="!m-4 flex flex-wrap items-center gap-2">
          {projectName ? (
            <div className="mr-2">
              <p className="text-sm font-semibold text-[var(--test-foreground)]">{projectName}</p>
              <p className="text-[11px] text-[var(--test-muted)]">Architecture canvas</p>
            </div>
          ) : null}

          {/* Organize dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-2xl border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)] hover:bg-[var(--test-accent-soft)]"
              >
                <Waypoints className="h-4 w-4" />
                Organize
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 rounded-xl border border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)]"
            >
              <DropdownMenuItem
                className="gap-2 text-xs"
                onSelect={handleAutoOrganize}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Auto-arrange nodes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs"
                onSelect={handleCreateGroup}
              >
                <Layers className="h-3.5 w-3.5" />
                Create group box
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-[var(--test-muted)]">
                Saved layouts
              </DropdownMenuLabel>

              {layouts.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-[var(--test-muted)]">
                  No saved layouts yet.
                </div>
              ) : (
                layouts.map((layout) => (
                  <DropdownMenuItem
                    key={layout.id}
                    className="group flex items-center justify-between gap-2 text-xs"
                    onSelect={() => handleLoadLayout(layout)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{layout.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayout(layout.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              {saveNamePrompt ? (
                <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <Input
                    autoFocus
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveLayout();
                      if (e.key === "Escape") { setSaveNamePrompt(false); setNewLayoutName(""); }
                    }}
                    placeholder="Layout name…"
                    className="h-7 text-xs"
                  />
                  <div className="mt-1.5 flex gap-1">
                    <Button
                      size="xs"
                      onClick={handleSaveLayout}
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => { setSaveNamePrompt(false); setNewLayoutName(""); }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <DropdownMenuItem
                  className="gap-2 text-xs"
                  onSelect={(e) => {
                    e.preventDefault();
                    setSaveNamePrompt(true);
                  }}
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Save current layout…
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Node */}
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-2xl border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)] hover:bg-[var(--test-accent-soft)]"
            onClick={() => {
              if (!projectID) {
                toast("Node creation mocked", { description: "Choose a project context first." });
                return;
              }
              setNewServerOpen(true);
            }}
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

        {/* Top-right: AI findings */}
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
                  <div key={suggestion.id} className="rounded-2xl border border-white/8 bg-black/12 p-3">
                    <p className="text-sm font-medium text-[var(--test-foreground)]">{suggestion.title}</p>
                    <p className="mt-1 text-xs leading-6 text-[var(--test-muted)]">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </Panel>

        {/* Bottom-left hint */}
        <Panel position="bottom-left" className="!m-4">
          <div className="flex items-center gap-2 rounded-full border border-[var(--test-border)] bg-[var(--test-panel)] px-4 py-2 text-xs text-[var(--test-muted)] backdrop-blur-lg">
            <Network className="h-3 w-3 shrink-0" />
            Scroll to zoom, drag empty canvas to pan, press C to center, select edge + Delete to remove.
          </div>
        </Panel>

        {/* Bottom-right zoom */}
        <Panel position="bottom-right" className="!m-4">
          <div className="rounded-2xl border border-[var(--test-border)] bg-[var(--test-panel)] px-4 py-2 text-sm text-[var(--test-muted)] backdrop-blur-lg">
            Zoom {viewport.zoom.toFixed(2)}x
          </div>
        </Panel>
      </ReactFlow>

      {/* Node detail panel */}
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

      {/* New server wizard */}
      <NewServerSheet
        open={newServerOpen}
        onOpenChange={setNewServerOpen}
        projectID={projectID ?? null}
        activeServerNames={activeServerNames ?? []}
        onCreated={() => { requestRefreshBurst(); }}
      />

      {/* Group manager modal */}
      <GroupManagerModal
        open={groupModal.open}
        mode={groupModal.mode}
        initialData={groupModal.initialData}
        nodes={infrastructureNodes}
        onConfirm={handleConfirmGroup}
        onCancel={() => setGroupModal((prev) => ({ ...prev, open: false }))}
        onDelete={
          groupModal.mode === "edit" && groupModal.editId
            ? () => {
                handleDeleteGroup(groupModal.editId!);
                setGroupModal((prev) => ({ ...prev, open: false }));
              }
            : undefined
        }
      />
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────────────────────

export function InfrastructureFlowCanvas({
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
    <ReactFlowProvider>
      <FlowCanvasBody
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
    </ReactFlowProvider>
  );
}
