"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { InteractiveDotField } from "./InteractiveDotField";

export function ArchitectureThemeShell({ children }: { children: ReactNode }) {
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
      className="relative h-full w-full overflow-hidden text-[var(--test-foreground)]"
      style={{ background: "var(--test-background)" }}
    >
      <InteractiveDotField containerRef={containerRef} overlayDotColor={overlayDotColor} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
