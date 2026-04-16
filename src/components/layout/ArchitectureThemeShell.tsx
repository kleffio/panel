"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { InteractiveDotField } from "@kleffio/ui";

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
      style={{
        backgroundColor: "#0c0d11",
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <InteractiveDotField containerRef={containerRef} overlayDotColor={overlayDotColor} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
