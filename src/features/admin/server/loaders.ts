import "server-only";

import { simulateRequest } from "@/lib/mock/request";

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Finance" | "Support";
  status: "Active" | "Pending review" | "Suspended";
  mfaEnabled: boolean;
  lastSeen: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: "Admin" | "Finance" | "Support";
  sentAt: string;
};

export type AuditEvent = {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity: "info" | "warning" | "critical";
};

export type AdminRequest = {
  id: string;
  title: string;
  type: "Access" | "Capacity" | "Finance";
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  submittedAt: string;
  detail: string;
};

export type OrgSettingsData = {
  orgName: string;
  billingEmail: string;
  plan: string;
  ramLimit: number;
  ramUsed: number;
  seatsUsed: number;
  seatsTotal: number;
  activeProjects: number;
  pendingApprovals: number;
  securityScore: number;
  members: AdminMember[];
  pendingInvites: PendingInvite[];
  requests: AdminRequest[];
  auditTrail: AuditEvent[];
};

const fixture: OrgSettingsData = {
  orgName: "Kleffio Corporation",
  billingEmail: "admin@kleff.io",
  plan: "Pro Enterprise",
  ramLimit: 64,
  ramUsed: 42,
  seatsUsed: 8,
  seatsTotal: 12,
  activeProjects: 14,
  pendingApprovals: 3,
  securityScore: 89,
  members: [
    {
      id: "member-1",
      name: "Aida V",
      email: "aida@kleff.io",
      role: "Owner",
      status: "Active",
      mfaEnabled: true,
      lastSeen: "2 min ago",
    },
    {
      id: "member-2",
      name: "Jules Carter",
      email: "jules@kleff.io",
      role: "Admin",
      status: "Active",
      mfaEnabled: true,
      lastSeen: "18 min ago",
    },
    {
      id: "member-3",
      name: "Rina Patel",
      email: "rina@kleff.io",
      role: "Finance",
      status: "Pending review",
      mfaEnabled: false,
      lastSeen: "Yesterday",
    },
    {
      id: "member-4",
      name: "Marco Bell",
      email: "marco@kleff.io",
      role: "Support",
      status: "Suspended",
      mfaEnabled: true,
      lastSeen: "4 days ago",
    },
  ],
  pendingInvites: [
    { id: "invite-1", email: "ops@kleff.io", role: "Admin", sentAt: "10 minutes ago" },
    { id: "invite-2", email: "finance@kleff.io", role: "Finance", sentAt: "1 hour ago" },
  ],
  requests: [
    {
      id: "request-1",
      title: "Increase RAM ceiling to 64 GB",
      type: "Capacity",
      status: "Pending",
      requestedBy: "Jules Carter",
      submittedAt: "22 min ago",
      detail: "Needed for two overlapping deploy windows in production.",
    },
    {
      id: "request-2",
      title: "Approve finance access for Rina Patel",
      type: "Access",
      status: "Pending",
      requestedBy: "Aida V",
      submittedAt: "54 min ago",
      detail: "Access is blocked until MFA verification is completed.",
    },
    {
      id: "request-3",
      title: "Update billing contact routing",
      type: "Finance",
      status: "Pending",
      requestedBy: "Jules Carter",
      submittedAt: "1 hour ago",
      detail: "Route invoice escalation notices to the shared finance alias.",
    },
  ],
  auditTrail: [
    {
      id: "event-1",
      title: "Directory sync completed",
      detail: "3 new identities were mapped to admin policies.",
      time: "5 min ago",
      severity: "info",
    },
    {
      id: "event-2",
      title: "RAM ceiling change requested",
      detail: "Requested increase from 48 GB to 64 GB is awaiting approval.",
      time: "22 min ago",
      severity: "warning",
    },
    {
      id: "event-3",
      title: "Suspicious login challenge",
      detail: "A Toronto sign-in required step-up verification for finance scope.",
      time: "2 hours ago",
      severity: "critical",
    },
  ],
};

export async function getOrgSettings(): Promise<OrgSettingsData> {
  return simulateRequest(fixture);
}
