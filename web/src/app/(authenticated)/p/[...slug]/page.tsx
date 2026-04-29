"use client";

import { use, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { pluginRegistry } from "@/features/plugins/lib/registry";
import { useBackendPlugins } from "@/features/plugins/model/use-backend-plugins";
import { get } from "@/lib/api/request";

interface PluginPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Catch-all route for plugin-registered pages, scoped under `/p/*`.
 *
 * Two kinds of plugin pages are supported:
 *  1. Frontend JS plugins — register a component via the plugin registry.
 *  2. Backend gRPC plugins — expose a route at `/api/v1/p/...` and return JSON.
 *     Detected by checking the backend nav items; content is fetched from the API.
 */
export default function PluginPage({ params }: PluginPageProps) {
  const { slug } = use(params);
  // path is the slug portion only (e.g. "/hello-dotnet/hello")
  // fullPath includes the /p prefix to match nav item hrefs (e.g. "/p/hello-dotnet/hello")
  const path = "/" + slug.join("/");
  const fullPath = "/p" + path;

  useSyncExternalStore(
    pluginRegistry.subscribe.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
    pluginRegistry.getSnapshot.bind(pluginRegistry),
  );

  const reg = pluginRegistry.getPagePlugin(path);
  const { navItems } = useBackendPlugins();

  const isBackendRoute = !reg && pluginRegistry.settled && navItems.some((item) => item.href === fullPath);

  const { data: backendData, isLoading: backendLoading, isError: backendError } = useQuery({
    queryKey: ["plugin-page", fullPath],
    queryFn: () => get<unknown>(`/api/v1${fullPath}`),
    enabled: isBackendRoute,
    retry: false,
  });

  if (reg?.component) {
    const Component = reg.component;
    return <Component {...reg.props} />;
  }

  if (!pluginRegistry.settled) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading plugin…
      </div>
    );
  }

  if (isBackendRoute) {
    if (backendLoading) {
      return (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      );
    }
    if (backendError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-2xl font-semibold">Error</div>
          <div className="text-sm">The plugin returned an error.</div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <pre className="rounded-lg border bg-muted/40 p-4 text-sm overflow-auto">
          {JSON.stringify(backendData, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="text-2xl font-semibold">404</div>
      <div className="text-sm">No plugin is registered for {fullPath}.</div>
    </div>
  );
}
