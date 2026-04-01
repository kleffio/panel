import type { KleffPlugin, SlotName, SlotRegistration } from "@kleffio/sdk";

// ─── Registry ─────────────────────────────────────────────────────────────────

class PluginRegistry {
  private _plugins: KleffPlugin[] = [];
  private readonly _listeners: Set<() => void> = new Set();

  /** Register a frontend plugin created with definePlugin(). */
  register(plugin: KleffPlugin): void {
    if (this._plugins.some((p) => p.manifest.id === plugin.manifest.id)) {
      console.warn(`[kleff] Plugin "${plugin.manifest.id}" is already registered. Skipping.`);
      return;
    }
    this._plugins = [...this._plugins, plugin];
    this._listeners.forEach((fn) => fn());
  }

  /** Subscribe to registry changes (for useSyncExternalStore). Returns unsubscribe fn. */
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** Stable snapshot reference for useSyncExternalStore. */
  getSnapshot(): readonly KleffPlugin[] {
    return this._plugins;
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

  /** All registered frontend plugins. */
  get plugins(): KleffPlugin[] {
    return [...this._plugins];
  }

  /** Reset all registrations (used in tests / hot-reload). */
  reset(): void {
    this._plugins = [];
  }
}

export const pluginRegistry = new PluginRegistry();
