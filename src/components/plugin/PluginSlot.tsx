"use client";

import { Component, useSyncExternalStore, type ErrorInfo, type ReactNode } from "react";
import type { SlotName } from "@kleffio/sdk";
import { pluginRegistry } from "@/lib/plugins/registry";

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface BoundaryProps {
  pluginId: string;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

class PluginErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[kleff] Plugin "${this.props.pluginId}" threw an error:`, error, info);
  }

  render() {
    if (this.state.error) {
      return null; // Fail silently — don't break the panel
    }
    return this.props.children;
  }
}

// ─── PluginSlot ───────────────────────────────────────────────────────────────

interface PluginSlotProps {
  name: SlotName;
  /** Extra props forwarded to every component in this slot. */
  slotProps?: Record<string, unknown>;
  /**
   * Default content rendered when no plugin has registered for this slot.
   * If a plugin registers for this slot, it replaces these children entirely.
   *
   * Usage (override slot):
   * ```tsx
   * <PluginSlot name="dashboard.metrics">
   *   <DefaultMetrics />
   * </PluginSlot>
   * ```
   *
   * Usage (injection slot, no default):
   * ```tsx
   * <PluginSlot name="dashboard.top" />
   * ```
   */
  children?: ReactNode;
}

export function PluginSlot({ name, slotProps, children }: PluginSlotProps) {
  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );
  const registrations = pluginRegistry.getSlotRegistrations(name);

  // No plugin registered → render default content (or nothing for injection slots)
  if (registrations.length === 0) return <>{children}</>;

  // Plugin registered → render plugin components, replacing the default
  return (
    <>
      {registrations.map((reg, index) => {
        const Component = reg.component;
        if (!Component) return null;

        const mergedProps = { ...reg.props, ...slotProps };

        return (
          <PluginErrorBoundary
            key={`${name}-${index}`}
            pluginId={String(mergedProps.pluginId ?? `slot-${name}-${index}`)}
          >
            <Component {...mergedProps} />
          </PluginErrorBoundary>
        );
      })}
    </>
  );
}
