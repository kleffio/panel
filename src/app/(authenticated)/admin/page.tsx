import type { Metadata } from "next";
import { getOrgSettings } from "@/features/admin/server/loaders";
import { AdminDashboard } from "@/features/admin/ui/AdminDashboard";

export const metadata: Metadata = { title: "Admin Settings" };

export default async function AdminPage() {
  const initialData = await getOrgSettings();
  return <AdminDashboard initialData={initialData} />;
}
