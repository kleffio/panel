"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { SlotName } from "@kleffio/sdk";
import { pluginRegistry } from "@/features/plugins/lib/registry";
import { PluginErrorBoundary } from "@/features/plugins/lib/PluginErrorBoundary";

// ─── PluginWrapper ────────────────────────────────────────────────────────────
// Wraps default panel content that plugins can override.
// Children are the default UI — rendered when no plugin has registered for this slot.
// Use <PluginSlot /> (no children) for pure injection points.

interface PluginWrapperProps {
  name: SlotName;
  /** The default content to render when no plugin overrides this slot. */
  children: ReactNode;
  /** Extra props forwarded to every plugin component in this slot. */
  slotProps?: Record<string, unknown>;
  /** When provided, renders as a div with this className instead of a fragment. */
  className?: string;
}

export function PluginWrapper({ name, slotProps, className, children }: PluginWrapperProps) {
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
