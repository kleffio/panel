import type { KleffPlugin, SlotName, SlotRegistration } from "@kleffio/sdk";

// ─── Backend-driven nav items (from PluginUI gRPC manifests) ─────────────────

export interface BackendNavItem {
  pluginId: string;
  label: string;
  icon?: string;
  path: string;
  permission?: string;
  children?: BackendNavItem[];
}

export interface BackendSettingsPage {
  pluginId: string;
  label: string;
  path: string;
  iframeUrl?: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

class PluginRegistry {
  private readonly _plugins: KleffPlugin[] = [];
  private readonly _backendNavItems: BackendNavItem[] = [];
  private readonly _backendSettingsPages: BackendSettingsPage[] = [];

  /** Register a frontend plugin created with definePlugin(). */
  register(plugin: KleffPlugin): void {
    if (this._plugins.some((p) => p.manifest.id === plugin.manifest.id)) {
      console.warn(`[kleff] Plugin "${plugin.manifest.id}" is already registered. Skipping.`);
      return;
    }
    this._plugins.push(plugin);
  }

  /** Register a nav item contributed by a backend plugin (from UIManifest). */
  registerNavItem(item: BackendNavItem): void {
    this._backendNavItems.push(item);
  }

  /** Register a settings page contributed by a backend plugin (from UIManifest). */
  registerSettingsPage(page: BackendSettingsPage): void {
    this._backendSettingsPages.push(page);
  }

  /**
   * Returns all slot registrations for the given slot name, sorted by priority
   * (lower priority number = rendered first, default 100).
   */
  getSlotRegistrations(slotName: SlotName): SlotRegistration[] {
    const registrations: SlotRegistration[] = [];
    for (const plugin of this._plugins) {
      for (const reg of plugin.manifest.slots) {
        if (reg.slot === slotName) {
          registrations.push(reg);
        }
      }
    }
    return registrations.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  /**
   * Returns the page slot registration matching `path`, or undefined if none.
   * Path comparison is exact (e.g. "/components" matches props.path === "/components").
   */
  getPagePlugin(path: string): SlotRegistration | undefined {
    for (const plugin of this._plugins) {
      for (const reg of plugin.manifest.slots) {
        if (reg.slot === "page" && reg.props?.path === path) {
          return reg;
        }
      }
    }
    return undefined;
  }

  /** All backend-driven nav items. */
  get backendNavItems(): BackendNavItem[] {
    return [...this._backendNavItems];
  }

  /** All backend-driven settings pages. */
  get backendSettingsPages(): BackendSettingsPage[] {
    return [...this._backendSettingsPages];
  }

  /** All registered frontend plugins. */
  get plugins(): KleffPlugin[] {
    return [...this._plugins];
  }

  /** Reset all registrations (used in tests / hot-reload). */
  reset(): void {
    this._plugins.length = 0;
    this._backendNavItems.length = 0;
    this._backendSettingsPages.length = 0;
  }
}

export const pluginRegistry = new PluginRegistry();
