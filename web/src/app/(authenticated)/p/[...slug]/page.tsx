"use client";

import { use, useSyncExternalStore } from "react";
import { pluginRegistry } from "@/features/plugins/lib/registry";

interface PluginPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Catch-all route for plugin-registered pages, scoped under `/p/*`.
 * A plugin registers a page via:
 *   slots: [{ slot: "page", component: MyPage, props: { path: "/my-page" } }]
 * and it becomes available at `/p/my-page`.
 */
export default function PluginPage({ params }: PluginPageProps) {
  const { slug } = use(params);
  const path = "/" + slug.join("/");

  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );

  const reg = pluginRegistry.getPagePlugin(path);

  if (!reg || !reg.component) {
    if (pluginRegistry.settled) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-2xl font-semibold">404</div>
          <div className="text-sm">No plugin is registered for {path}.</div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading plugin…
      </div>
    );
  }

  const Component = reg.component;
  return <Component {...reg.props} />;
}
