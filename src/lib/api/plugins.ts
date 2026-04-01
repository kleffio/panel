import { get } from "./request";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackendNavItem {
  label: string;
  /** Lucide icon name (e.g. "Globe", "Server"). Falls back to Puzzle icon. */
  icon?: string;
  path: string;
  /** Role name required to see this item (e.g. "admin"). Omit = visible to all. */
  permission?: string;
  children?: BackendNavItem[];
}

export interface BackendSettingsPage {
  label: string;
  /** URL-safe identifier used as the iframe section key. */
  path: string;
  /** URL to load inside an iframe. If omitted the section is skipped. */
  iframe_url?: string;
}

export interface BackendPluginUIManifest {
  plugin_id: string;
  nav_items?: BackendNavItem[];
  settings_pages?: BackendSettingsPage[];
}

export interface PluginUIManifestsResponse {
  plugins: BackendPluginUIManifest[];
}

// ─── Installed plugins ────────────────────────────────────────────────────────

export interface InstalledPlugin {
  id: string;
  display_name: string;
  frontend_url: string | null;
  enabled: boolean;
}

export interface InstalledPluginsResponse {
  plugins: InstalledPlugin[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getPluginUIManifests() {
  return get<PluginUIManifestsResponse>("/api/v1/plugins/ui-manifests");
}

export function getInstalledPlugins() {
  return get<{ data: InstalledPluginsResponse }>("/api/v1/admin/plugins").then((r) => r.data);
}
