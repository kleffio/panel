import type { ReactNode } from "react";
import { PersonalHubSidebar } from "./PersonalHubSidebar";

export function PersonalHubShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PersonalHubSidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  );
}
