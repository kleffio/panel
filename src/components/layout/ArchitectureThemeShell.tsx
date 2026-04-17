"use client";

import { useRef, type ReactNode } from "react";
import { InteractiveDotField } from "@kleffio/ui";

export function ArchitectureThemeShell({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayDotColor = "rgba(245, 181, 23, 0.24)";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden text-[var(--test-foreground)]"
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(110% 120% at 50% 0%, rgba(245,181,23,0.14) 0%, rgba(245,181,23,0.04) 30%, rgba(6,6,7,0.93) 68%), linear-gradient(180deg, rgba(4,4,4,0.96) 0%, rgba(2,2,2,1) 100%)",
      }}
    >
      <InteractiveDotField containerRef={containerRef} overlayDotColor={overlayDotColor} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
