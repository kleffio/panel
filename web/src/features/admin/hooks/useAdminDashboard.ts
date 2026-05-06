"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateOrgSettings } from "@/features/admin/server/actions";
import {
  roleOptions,
  requestTypeFilters,
  requestStatusFilters,
  incidentActions,
} from "@/features/admin/model/constants";
import type { AdminMember, AdminRequest, OrgSettingsData } from "@/features/admin/server/loaders";

export function useAdminDashboard(initialData: OrgSettingsData) {
  const [name, setName] = React.useState(initialData.orgName);
  const [ramLimit, setRamLimit] = React.useState(initialData.ramLimit);
  const [members, setMembers] = React.useState(initialData.members);
  const [requests, setRequests] = React.useState(initialData.requests);
  const [isPending, setIsPending] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<(typeof roleOptions)[number]>("Admin");
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [sessionLockdown, setSessionLockdown] = React.useState(true);
  const [auditWebhook, setAuditWebhook] = React.useState(
    "https://hooks.kleff.io/audit/admin"
  );
  const [pendingIncidentAction, setPendingIncidentAction] = React.useState<
    (typeof incidentActions)[number] | null
  >(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [requestTypeFilter, setRequestTypeFilter] = React.useState<
    (typeof requestTypeFilters)[number]
  >("All");
  const [requestStatusFilter, setRequestStatusFilter] = React.useState<
    (typeof requestStatusFilters)[number]
  >("All");

  const seatUsage = Math.round(
    (initialData.seatsUsed / initialData.seatsTotal) * 100
  );
  const ramUsage = Math.round((initialData.ramUsed / ramLimit) * 100);
  const pendingRequestCount = requests.filter(
    (r) => r.status === "Pending"
  ).length;
  const filteredRequests = requests.filter((r) => {
    const matchesType =
      requestTypeFilter === "All" || r.type === requestTypeFilter;
    const matchesStatus =
      requestStatusFilter === "All" || r.status === requestStatusFilter;
    return matchesType && matchesStatus;
  });

  function handleQuickAction(label: string, description: string) {
    toast.success(label, { description });
  }

  async function handleSave() {
    setIsPending(true);
    try {
      const res = await updateOrgSettings({ orgName: name, ramLimit });
      if (res.success) {
        toast.success(res.message);
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsPending(false);
    }
  }

  function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Invite email is required");
      return;
    }
    toast.success("Admin invite staged", {
      description: `${inviteEmail} will be added as ${inviteRole.toLowerCase()} after approval.`,
    });
    setInviteEmail("");
    setInviteRole("Admin");
  }

  function handleMemberAction(
    member: AdminMember,
    action: "Review access" | "Reset session" | "Suspend"
  ) {
    if (action === "Suspend") {
      setMembers((current) =>
        current.map((entry) =>
          entry.id === member.id ? { ...entry, status: "Suspended" } : entry
        )
      );
    }
    toast(action === "Suspend" ? "Member suspended" : action, {
      description:
        action === "Suspend"
          ? `${member.name} has been moved into suspended state.`
          : `${action} was queued for ${member.name}.`,
    });
  }

  function handleRequestAction(
    request: AdminRequest,
    status: "Approved" | "Rejected"
  ) {
    setRequests((current) =>
      current.map((entry) =>
        entry.id === request.id ? { ...entry, status } : entry
      )
    );
    toast.success(
      status === "Approved" ? "Request approved" : "Request rejected",
      { description: `${request.title} was ${status.toLowerCase()}.` }
    );
  }

  return {
    name,
    setName,
    ramLimit,
    setRamLimit,
    members,
    requests,
    isPending,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    maintenanceMode,
    setMaintenanceMode,
    sessionLockdown,
    setSessionLockdown,
    auditWebhook,
    setAuditWebhook,
    pendingIncidentAction,
    setPendingIncidentAction,
    activeTab,
    setActiveTab,
    requestTypeFilter,
    setRequestTypeFilter,
    requestStatusFilter,
    setRequestStatusFilter,
    seatUsage,
    ramUsage,
    pendingRequestCount,
    filteredRequests,
    handleQuickAction,
    handleSave,
    handleInvite,
    handleMemberAction,
    handleRequestAction,
  };
}
