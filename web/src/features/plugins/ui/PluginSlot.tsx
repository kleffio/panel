"use client";

import { useSyncExternalStore } from "react";
import type { SlotName } from "@kleffio/sdk";
import { pluginRegistry } from "@/features/plugins/lib/registry";
import { PluginErrorBoundary } from "@/features/plugins/lib/PluginErrorBoundary";

// ─── PluginSlot ───────────────────────────────────────────────────────────────
// Pure injection point — renders plugin components registered for this slot.
// Does NOT accept children. Use <PluginWrapper> when default content is needed.

interface PluginSlotProps {
  name: SlotName;
  /** Extra props forwarded to every component in this slot. */
  slotProps?: Record<string, unknown>;
  /** When provided, renders as a div with this className instead of a fragment. */
  className?: string;
}

export function PluginSlot({ name, slotProps, className }: PluginSlotProps) {
  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );
  const registrations = pluginRegistry.getSlotRegistrations(name);

  const content = registrations.map((reg, index) => {
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
