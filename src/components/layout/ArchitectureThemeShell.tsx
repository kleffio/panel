"use client";

import type { ReactNode } from "react";

export function ArchitectureThemeShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden text-[var(--test-foreground)]"
      style={{ background: "var(--test-background)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--test-overlay-dot, rgba(255, 255, 255, 0.08)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
