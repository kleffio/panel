"use client";

import { use, useSyncExternalStore } from "react";
import { pluginRegistry } from "@/lib/plugins/registry";

interface PluginPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Catch-all route for plugin-registered pages.
 * A plugin registers a page via:
 *   slots: [{ slot: "page", component: MyPage, props: { path: "/my-page" } }]
 * It will be available at /my-page.
 */
export default function PluginPage({ params }: PluginPageProps) {
  const { slug } = use(params);
  const path = "/" + slug.join("/");

  // Subscribe so we re-render when a plugin script loads and self-registers.
  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );

  const reg = pluginRegistry.getPagePlugin(path);

  if (!reg || !reg.component) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading plugin…
      </div>
    );
  }

  const Component = reg.component;
  return <Component {...reg.props} />;
}
