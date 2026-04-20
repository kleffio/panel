"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Node } from "reactflow";
import { applyNodeChanges } from "reactflow";
import type { NodeChange } from "reactflow";
import { toast } from "sonner";

import { GROUP_COLORS, type GroupNodeData } from "@/features/hosting/ui/GroupNode";
import type { GroupFormData } from "@/features/hosting/ui/GroupManagerModal";
import type { CanvasGroup } from "@/features/hosting/model/types";
import type { InfrastructureFlowNodeData } from "@/features/hosting/lib/infrastructure-graph";

// ── localStorage helpers ───────────────────────────────────────────────────────

function loadGroups(projectID: string): CanvasGroup[] {
  try {
    const raw = localStorage.getItem(`kleff:groups:${projectID}`);
    return raw ? (JSON.parse(raw) as CanvasGroup[]) : [];
  } catch {
    return [];
  }
}

function persistGroups(projectID: string, groups: CanvasGroup[]) {
  try {
    localStorage.setItem(`kleff:groups:${projectID}`, JSON.stringify(groups));
  } catch {
    // ignore storage quota errors
  }
}

// ── Domain helpers ─────────────────────────────────────────────────────────────

function domainGroupToFlowNode(group: CanvasGroup): Node<GroupNodeData> {
  return {
    id: group.id,
    type: "group",
    position: group.position,
    style: { width: group.size.width, height: group.size.height },
    data: {
      label: group.label,
      color: group.color,
      memberIds: group.memberIds,
      memberCount: group.memberIds.length,
      avgCpu: null,
      computedStatus: null,
      notes: group.notes,
      role: group.role,
    },
    draggable: true,
    selectable: true,
    zIndex: -1,
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export type GroupModal = {
  open: boolean;
  mode: "create" | "edit";
  editId: string | null;
  initialData?: GroupFormData;
};

export function useCanvasGroups({
  projectID,
  flowNodesRef,
}: {
  projectID?: string | null;
  flowNodesRef: React.RefObject<Array<Node<InfrastructureFlowNodeData>>>;
}) {
  const colorIndexRef = useRef(0);

  const [groups, setGroups] = useState<CanvasGroup[]>(() =>
    projectID ? loadGroups(projectID) : [],
  );

  const [groupModal, setGroupModal] = useState<GroupModal>({
    open: false,
    mode: "create",
    editId: null,
  });

  // Sync to localStorage whenever groups change
  const updateGroups = useCallback(
    (updater: (prev: CanvasGroup[]) => CanvasGroup[]) => {
      setGroups((prev) => {
        const next = updater(prev);
        if (projectID) persistGroups(projectID, next);
        return next;
      });
    },
    [projectID],
  );

  const groupNodes = useMemo(
    () => groups.map(domainGroupToFlowNode),
    [groups],
  );

  const groupNodeIds = useMemo(
    () => new Set(groups.map((g) => g.id)),
    [groups],
  );

  const handleDeleteGroup = useCallback(
    (id: string) => {
      updateGroups((prev) => prev.filter((g) => g.id !== id));
    },
    [updateGroups],
  );

  const handleEditGroup = useCallback(
    (id: string) => {
      const target = groups.find((g) => g.id === id);
      if (!target) return;
      setGroupModal({
        open: true,
        mode: "edit",
        editId: id,
        initialData: {
          label: target.label,
          color: target.color,
          memberIds: target.memberIds,
          notes: target.notes,
          role: target.role,
        },
      });
    },
    [groups],
  );

  const handleOpenCreateModal = useCallback(() => {
    const color = GROUP_COLORS[colorIndexRef.current % GROUP_COLORS.length];
    colorIndexRef.current += 1;
    setGroupModal({
      open: true,
      mode: "create",
      editId: null,
      initialData: { label: "New Group", color, memberIds: [], notes: "", role: "" },
    });
  }, []);

  const handleConfirmGroup = useCallback(
    (formData: GroupFormData, editId: string | null, mode: "create" | "edit") => {
      if (mode === "edit" && editId) {
        updateGroups((gs) =>
          gs.map((g) =>
            g.id === editId
              ? {
                  ...g,
                  label: formData.label,
                  color: formData.color,
                  memberIds: formData.memberIds,
                  notes: formData.notes,
                  role: formData.role,
                }
              : g,
          ),
        );
      } else {
        const id = `group-${Date.now()}`;
        let position = { x: 80, y: 80 };
        let width = 380;
        let height = 280;

        const currentFlowNodes = flowNodesRef.current ?? [];
        if (formData.memberIds.length > 0) {
          const memberNodes = currentFlowNodes.filter((n) =>
            formData.memberIds.includes(n.id),
          );
          if (memberNodes.length > 0) {
            const PAD = 48;
            const xs = memberNodes.map((n) => n.position.x);
            const ys = memberNodes.map((n) => n.position.y);
            const x2s = memberNodes.map((n) => n.position.x + (n.width ?? 220));
            const y2s = memberNodes.map((n) => n.position.y + (n.height ?? 110));
            const minX = Math.min(...xs) - PAD;
            const minY = Math.min(...ys) - PAD - 36;
            const maxX = Math.max(...x2s) + PAD;
            const maxY = Math.max(...y2s) + PAD;
            position = { x: minX, y: minY };
            width = Math.max(380, maxX - minX);
            height = Math.max(280, maxY - minY);
          }
        }

        const newGroup: CanvasGroup = {
          id,
          label: formData.label,
          color: formData.color,
          memberIds: formData.memberIds,
          notes: formData.notes,
          role: formData.role,
          position,
          size: { width, height },
        };

        updateGroups((gs) => [...gs, newGroup]);
        toast.success(`Group "${formData.label}" created`);
      }

      setGroupModal((prev) => ({ ...prev, open: false }));
    },
    [updateGroups, flowNodesRef],
  );

  const handleGroupNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const groupChanges = changes.filter((c) =>
        groupNodeIds.has((c as { id: string }).id),
      );
      if (groupChanges.length === 0) return;

      // Apply position/dimension changes back to domain groups
      setGroups((prev) => {
        const updated = prev.map((g) => {
          const relevant = groupChanges.filter(
            (c) => (c as { id: string }).id === g.id,
          );
          if (relevant.length === 0) return g;

          const [applied] = applyNodeChanges(relevant, [domainGroupToFlowNode(g)]);
          if (!applied) return g;

          return {
            ...g,
            position: applied.position,
            size: {
              width: (applied.style?.width as number | undefined) ?? g.size.width,
              height: (applied.style?.height as number | undefined) ?? g.size.height,
            },
          };
        });
        if (projectID) persistGroups(projectID, updated);
        return updated;
      });
    },
    [groupNodeIds, projectID],
  );

  return {
    groupNodes,
    groupNodeIds,
    groupModal,
    setGroupModal,
    handleDeleteGroup,
    handleEditGroup,
    handleOpenCreateModal,
    handleConfirmGroup,
    handleGroupNodesChange,
  };
}
