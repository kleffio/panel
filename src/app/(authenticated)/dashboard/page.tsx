import type { Metadata } from "next";
import { DashboardView } from "@/features/hosting/pages/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardView />;
}
