"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { pluginRegistry } from "@/lib/plugins/registry";

interface PluginPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Catch-all route for plugin-registered pages.
 * A plugin registers a page via:
 *   slots: [{ slot: "page", component: MyPage, props: { path: "/my-page" } }]
 * It will be available at /p/my-page.
 */
export default function PluginPage({ params }: PluginPageProps) {
  const { slug } = use(params);
  const path = "/" + slug.join("/");

  const reg = pluginRegistry.getPagePlugin(path);

  if (!reg || !reg.component) {
    notFound();
  }

  const Component = reg.component;
  return <Component {...reg.props} />;
}
