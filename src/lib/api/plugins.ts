import { get, post, del } from "./request";

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
  type: string;
  is_active_idp: boolean;
}

export interface InstalledPluginsResponse {
  plugins: InstalledPlugin[];
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface ConfigField {
  key: string;
  label: string;
  description?: string;
  type: "string" | "secret" | "number" | "boolean" | "select" | "url";
  required: boolean;
  default?: string;
  options?: string[];
}

export interface CatalogPlugin {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  author: string;
  image: string;
  version: string;
  verified: boolean;
  logo?: string;
  config?: ConfigField[];
}

export interface CatalogResponse {
  plugins: CatalogPlugin[];
  cached_at: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getPluginUIManifests() {
  return get<PluginUIManifestsResponse>("/api/v1/plugins/ui-manifests");
}

export function getInstalledPlugins() {
  return get<{ data: InstalledPluginsResponse }>("/api/v1/admin/plugins").then((r) => r.data);
}

export function getCatalog() {
  return get<{ data: CatalogResponse }>("/api/v1/plugins/catalog").then((r) => r.data);
}

export function installPlugin(id: string, config: Record<string, string> = {}) {
  return post<void, { id: string; config: Record<string, string> }>("/api/v1/admin/plugins", { id, config });
}

export function uninstallPlugin(id: string) {
  return del<void>(`/api/v1/admin/plugins/${id}`);
}

export function setActiveIDP(id: string) {
  return post<void, Record<string, never>>(`/api/v1/admin/plugins/${id}/set-active`, {});
}
