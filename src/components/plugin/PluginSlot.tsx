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
   * When provided, PluginSlot renders as a div with this className instead of
   * a fragment — eliminating the need for a wrapper div inside the slot.
   *
   * ```tsx
   * <PluginSlot name="dashboard.metrics" className="grid grid-cols-4 gap-4">
   *   <MetricCard ... />
   * </PluginSlot>
   * ```
   */
  className?: string;
  children?: ReactNode;
}

export function PluginSlot({ name, slotProps, className, children }: PluginSlotProps) {
  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );
  const registrations = pluginRegistry.getSlotRegistrations(name);

  const content =
    registrations.length === 0
      ? children
      : registrations.map((reg, index) => {
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
        });

  if (className) return <div className={className}>{content}</div>;
  return <>{content}</>;
}
