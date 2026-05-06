"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

/** Fetches notifications. Pass `{ unread: true }` to filter to unread only. */
export function useNotifications(params?: { unread?: boolean }) {
  const key = params?.unread ? [...NOTIFICATIONS_KEY, "unread"] : NOTIFICATIONS_KEY;
  return useQuery({
    queryKey: key,
    queryFn: () => listNotifications({ limit: 50, unread: params?.unread }),
    staleTime: 30_000,
  });
}

/** Fetches the unread notification count. */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCount,
    staleTime: 30_000,
  });
}

/** Returns mutations for marking read, marking all read, and deleting. */
export function useNotificationActions() {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  }

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidate,
  });

  return { markRead, markAllRead, remove };
}
