import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  );
}
