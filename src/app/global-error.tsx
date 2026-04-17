"use client";

import { useEffect } from "react";

// global-error replaces the root layout, so it must include <html>/<body>.
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#09090b", color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100svh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", textAlign: "center", padding: "1.5rem" }}>
          <div style={{ fontSize: "clamp(120px,20vw,220px)", fontWeight: 900, lineHeight: 1, color: "rgba(202,169,80,0.05)", letterSpacing: "-0.04em", position: "absolute", userSelect: "none" }}>
            500
          </div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "0.7rem", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "oklch(0.80 0.17 90 / 0.7)" }}>
              500
            </p>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
            <p style={{ fontSize: "0.875rem", color: "#71717a", maxWidth: "360px", lineHeight: 1.6, margin: 0 }}>
              {error.message || "A critical error occurred. Please reload the page."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={reset}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "oklch(0.80 0.17 90)", color: "#09090b", fontWeight: 500, fontSize: "0.875rem", border: "none", cursor: "pointer" }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "transparent", color: "#fafafa", fontWeight: 500, fontSize: "0.875rem", border: "1px solid #27272a", textDecoration: "none" }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
