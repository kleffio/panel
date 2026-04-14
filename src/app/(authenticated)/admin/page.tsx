import type { Metadata } from "next";
import { PluginSlot } from "@/components/plugin/PluginSlot";
import { getOrgSettings } from "@/features/admin/server/loaders";
import { AdminDashboard } from "@/features/admin/ui/AdminDashboard";
import { AdminPluginSections } from "@/features/admin/ui/AdminPluginSections";

export const metadata: Metadata = { title: "Admin Settings" };

export default async function AdminPage() {
  const initialData = await getOrgSettings();
  return (
    <>
      <PluginSlot name="admin.top" />
      <AdminDashboard initialData={initialData} />
      <AdminPluginSections />
      <PluginSlot name="admin.bottom" />
    </>
  );
}
