import type { AdminMember, AdminRequest, OrgSettingsData } from "@/features/admin/server/loaders";

export function metricTone(value: number) {
  if (value >= 85) return "text-emerald-500";
  if (value >= 70) return "text-amber-500";
  return "text-rose-500";
}

export function memberStatusVariant(
  status: AdminMember["status"]
): "secondary" | "outline" | "destructive" {
  if (status === "Active") return "secondary";
  if (status === "Pending review") return "outline";
  return "destructive";
}

export function auditTone(
  severity: OrgSettingsData["auditTrail"][number]["severity"]
) {
  if (severity === "critical") return "border-l-rose-500";
  if (severity === "warning") return "border-l-amber-400";
  return "border-l-sky-500";
}

export function requestStatusVariant(
  status: AdminRequest["status"]
): "secondary" | "outline" | "destructive" {
  if (status === "Approved") return "secondary";
  if (status === "Rejected") return "destructive";
  return "outline";
}
