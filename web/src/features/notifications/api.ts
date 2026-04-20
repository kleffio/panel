import { apiClient } from "@/lib/api/client";

export type NotificationType =
  | "system"
  | "billing"
  | "org_invitation"
  | "project_invitation"
  | "deployment"
  | "workload"
  | "security";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface ListNotificationsParams {
  unread?: boolean;
  limit?: number;
  offset?: number;
}

export async function listNotifications(
  params?: ListNotificationsParams
): Promise<Notification[]> {
  const query = new URLSearchParams();
  if (params?.unread) query.set("unread", "true");
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const qs = query.toString();
  const res = await apiClient.get<{ notifications: Notification[] }>(
    `/api/v1/notifications${qs ? `?${qs}` : ""}`
  );
  return res.data.notifications;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<{ unread_count: number }>(
    "/api/v1/notifications/unread-count"
  );
  return res.data.unread_count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/api/v1/notifications/read-all");
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/notifications/${id}`);
}

/** Returns the raw base URL for the SSE stream (needs the auth token appended). */
export function getNotificationStreamURL(): string {
  return "/api/v1/notifications/stream";
}
