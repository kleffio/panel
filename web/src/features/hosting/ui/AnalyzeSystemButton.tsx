"use client";

import { Sparkles } from "lucide-react";
import { memo } from "react";

import { Button } from "@kleffio/ui";

export const AnalyzeSystemButton = memo(function AnalyzeSystemButton({
  active,
  issueCount,
  isAnalyzing,
  onClick,
}: {
  active: boolean;
  issueCount: number;
  isAnalyzing: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isAnalyzing}
      className={`h-10 rounded-2xl border ${
        active
          ? "border-amber-300/30 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18"
          : "border-[var(--test-border)] bg-[var(--test-panel)] text-[var(--test-foreground)] hover:bg-[var(--test-accent-soft)]"
      }`}
    >
      <Sparkles className={`h-4 w-4 ${isAnalyzing ? "animate-pulse" : ""}`} />
      {isAnalyzing ? "Analyzing..." : active ? "Clear Analysis" : "Analyze System"}
      {issueCount > 0 ? (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[var(--test-muted)]">
          {issueCount}
        </span>
      ) : null}
    </Button>
  );
});
