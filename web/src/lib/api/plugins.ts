import { get, post, del, patch } from "./request";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackendNavItem {
  label: string;
  /** Lucide icon name (e.g. "Globe", "Server"). Falls back to Puzzle icon. */
  icon?: string;
  href: string;
  /** Role name required to see this item (e.g. "admin"). Omit = visible to all. */
  permission?: string;
  children?: BackendNavItem[];
}

export interface BackendSettingsPage {
  label: string;
  /** Panel route for this settings page (e.g. "/settings/identity"). */
  href: string;
  /** URL to load inside an iframe. If omitted the section is skipped. */
  iframe_url?: string;
}

export interface BackendLoginConfig {
  disable_signup_link?: boolean;
}

export interface BackendSignupConfig {
  disabled?: boolean;
  hide_first_name?: boolean;
  hide_last_name?: boolean;
  hide_username?: boolean;
}

export interface BackendProfileSection {
  id: string;
  label: string;
  description?: string;
  iframe_url?: string;
  /** Native action keys this section supports (e.g. "change_password"). */
  actions?: string[];
}

export interface BackendPluginUIManifest {
  plugin_id: string;
  nav_items?: BackendNavItem[];
  settings_pages?: BackendSettingsPage[];
  login_config?: BackendLoginConfig;
  signup_config?: BackendSignupConfig;
  profile_sections?: BackendProfileSection[];
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
  advanced?: boolean;
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
  dependencies?: string[];
}

export interface CatalogResponse {
  plugins: CatalogPlugin[];
  cached_at: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getPluginUIManifests() {
  return get<{ data: PluginUIManifestsResponse }>("/api/v1/plugins/ui-manifests").then((r) => r.data);
}

export function getInstalledPlugins() {
  return get<{ data: InstalledPluginsResponse }>("/api/v1/plugins/installed").then((r) => r.data);
}

export function getInstalledPluginsAdmin() {
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

export interface InstalledPluginDetail {
  id: string;
  display_name: string;
  frontend_url: string | null;
  enabled: boolean;
  type: string;
  is_active_idp: boolean;
  config: Record<string, string>;
}

export function getPlugin(id: string) {
  return get<{ data: InstalledPluginDetail }>(`/api/v1/admin/plugins/${id}`).then((r) => r.data);
}

export function updatePluginConfig(id: string, config: Record<string, string>) {
  return patch<void, { config: Record<string, string> }>(`/api/v1/admin/plugins/${id}/config`, { config });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return post<{ data: { status: string } }, { current_password: string; new_password: string }>(
    "/api/v1/auth/change-password",
    { current_password: currentPassword, new_password: newPassword }
  );
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  ip_address?: string;
  user_agent?: string;
  /** Unix seconds */
  started_at?: number;
  /** Unix seconds */
  last_access?: number;
  /** Unix seconds; absent means the IDP did not report an expiry */
  expires_at?: number;
  current: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
}

export function listSessions(sid?: string) {
  const url = sid
    ? `/api/v1/auth/sessions?sid=${encodeURIComponent(sid)}`
    : "/api/v1/auth/sessions";
  return get<{ data: SessionsResponse }>(url).then((r) => r.data);
}

export function revokeSession(sessionID: string) {
  return del<void>(`/api/v1/auth/sessions/${sessionID}`);
}

export function revokeAllSessions(sid?: string) {
  const url = sid
    ? `/api/v1/auth/sessions?sid=${encodeURIComponent(sid)}`
    : "/api/v1/auth/sessions";
  return del<void>(url);
}
