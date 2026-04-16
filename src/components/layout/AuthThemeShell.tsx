"use client";

import type { ReactNode } from "react";

export function AuthThemeShell({
  children,
  showDots = true,
}: {
  children: ReactNode;
  showDots?: boolean;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-[var(--test-foreground)]"
      style={{ background: "var(--test-background)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-kleff-spotlight opacity-80" />
      {showDots ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(var(--test-overlay-dot, rgba(255, 255, 255, 0.08)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      ) : null}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
