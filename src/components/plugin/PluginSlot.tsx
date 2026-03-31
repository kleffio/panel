"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
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
}

/**
 * Renders all components registered for the given slot name.
 *
 * Usage:
 * ```tsx
 * <PluginSlot name="navbar.item" />
 * <PluginSlot name="dashboard.widget" />
 * ```
 */
export function PluginSlot({ name, slotProps }: PluginSlotProps) {
  const registrations = pluginRegistry.getSlotRegistrations(name);

  if (registrations.length === 0) return null;

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
