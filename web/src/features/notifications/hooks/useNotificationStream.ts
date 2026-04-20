"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiAccessToken } from "@/lib/api/token";
import type { Notification } from "../api";
import { NOTIFICATIONS_KEY, UNREAD_COUNT_KEY } from "./useNotifications";

/**
 * Opens an SSE connection to /api/v1/notifications/stream.
 * On receiving a new notification it:
 *   1. Prepends it to the cached notification list.
 *   2. Increments the cached unread count.
 *   3. Shows a toast.
 *
 * Automatically reconnects after a brief delay if the connection drops.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;

      // Pass the Bearer token as a query param since EventSource doesn't
      // support custom headers. The backend reads it from the Authorization
      // header OR the ?token= query param.
      const token = getApiAccessToken();
      const url = token
        ? `/api/v1/notifications/stream?token=${encodeURIComponent(token)}`
        : "/api/v1/notifications/stream";

      es = new EventSource(url);

      es.addEventListener("connected", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as { unread_count: number };
          queryClient.setQueryData(UNREAD_COUNT_KEY, payload.unread_count);
          // Sync the list cache so existing notifications appear immediately.
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        } catch {
          // ignore malformed payload
        }
      });

      es.addEventListener("notification", (e: MessageEvent) => {
        try {
          const notification = JSON.parse(e.data) as Notification;

          // Prepend to the cached list.
          queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (prev) =>
            prev ? [notification, ...prev] : [notification]
          );

          // Bump the unread counter.
          queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (prev) =>
            typeof prev === "number" ? prev + 1 : 1
          );

          // Show a toast for new incoming notifications.
          toast(notification.title, {
            description: notification.body || undefined,
          });
        } catch {
          // ignore malformed payload
        }
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [queryClient]);
}
