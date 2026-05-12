"use client";

import { useState } from "react";

const KEY = "kleff.viewMode";

export type ViewMode = "simplified" | "advanced";

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "advanced";
    return localStorage.getItem(KEY) === "simplified" ? "simplified" : "advanced";
  });

  function setViewMode(m: ViewMode) {
    localStorage.setItem(KEY, m);
    setMode(m);
  }

  return { mode, isSimplified: mode === "simplified", setViewMode };
}
