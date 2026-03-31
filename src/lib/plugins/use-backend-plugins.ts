import { useQuery } from "@tanstack/react-query";
import { getPluginUIManifests } from "@/lib/api/plugins";
import type { BackendNavItem, BackendSettingsPage } from "@/lib/api/plugins";

export type { BackendNavItem, BackendSettingsPage };

/**
 * Fetches UI manifests from backend plugins (gRPC-registered plugins that
 * expose nav items and iframe settings pages). Returns empty arrays if the
 * endpoint is unavailable — graceful degradation when no backend plugins exist.
 */
export function useBackendPlugins() {
  const query = useQuery({
    queryKey: ["plugins", "ui-manifests"],
    queryFn: getPluginUIManifests,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });

  const navItems: BackendNavItem[] = [];
  const settingsPages: BackendSettingsPage[] = [];

  for (const plugin of query.data?.plugins ?? []) {
    navItems.push(...(plugin.nav_items ?? []));
    settingsPages.push(...(plugin.settings_pages ?? []));
  }

  return { navItems, settingsPages, isLoading: query.isLoading };
}
