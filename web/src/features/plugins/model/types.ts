export const TYPE_LABELS: Record<string, string> = {
  idp:     "Infrastructure",
  infra:   "Infrastructure",
  ui:      "Project",
  project: "Project",
  user:    "Personal",
};

export type PluginTier = "infra" | "project" | "user";

export const PLUGIN_TIER: Record<string, PluginTier> = {
  idp:     "infra",
  infra:   "infra",
  ui:      "project",
  project: "project",
  user:    "user",
};

export const TIER_META: Record<PluginTier, { label: string; description: string; adminOnly: boolean }> = {
  infra: {
    label: "Infrastructure",
    description: "Platform-level plugins managed by your system administrator. Affect the entire installation.",
    adminOnly: true,
  },
  project: {
    label: "Project",
    description: "Plugins that extend a single project — like kanban boards, CI/CD integrations, or custom dashboards.",
    adminOnly: false,
  },
  user: {
    label: "Personal",
    description: "Plugins you install just for yourself. Only visible to you — no admin approval needed.",
    adminOnly: false,
  },
};

export type SheetMode = "install" | "edit" | "activate";
