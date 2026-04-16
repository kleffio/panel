"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { InteractiveDotField } from "@kleffio/ui";

export function AuthThemeShell({
  children,
  showDots = true,
}: {
  children: ReactNode;
  showDots?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const overlayDotColor = useMemo(() => {
    if (typeof window === "undefined") {
      return "rgba(255, 255, 255, 0.08)";
    }

    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--test-overlay-dot")
        .trim() || "rgba(255, 255, 255, 0.08)"
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-[var(--test-foreground)]"
      style={{ background: "var(--test-background)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-kleff-spotlight opacity-80" />
      {showDots ? <InteractiveDotField containerRef={containerRef} overlayDotColor={overlayDotColor} /> : null}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
