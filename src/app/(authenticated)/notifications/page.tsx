import type { Metadata } from "next";
import { NotificationsInboxPage } from "@/features/notifications/pages/NotificationsInboxPage";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsInboxPage />;
}
