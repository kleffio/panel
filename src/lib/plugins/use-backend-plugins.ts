import { useQuery } from "@tanstack/react-query";
import { getPluginUIManifests } from "@/lib/api/plugins";
import type {
  BackendNavItem,
  BackendSettingsPage,
  BackendLoginConfig,
  BackendSignupConfig,
  BackendProfileSection,
} from "@/lib/api/plugins";

export type {
  BackendNavItem,
  BackendSettingsPage,
  BackendLoginConfig,
  BackendSignupConfig,
  BackendProfileSection,
};

/**
 * Fetches UI manifests from backend plugins (gRPC-registered plugins that
 * expose nav items and iframe settings pages). Returns empty arrays/nulls if
 * the endpoint is unavailable — graceful degradation when no backend plugins exist.
 *
 * loginConfig and signupConfig are taken from the first plugin that provides
 * them (typically the active IDP plugin). profileSections are aggregated from
 * all plugins.
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
  const profileSections: BackendProfileSection[] = [];
  let loginConfig: BackendLoginConfig | null = null;
  let signupConfig: BackendSignupConfig | null = null;

  for (const plugin of query.data?.plugins ?? []) {
    navItems.push(...(plugin.nav_items ?? []));
    settingsPages.push(...(plugin.settings_pages ?? []));
    profileSections.push(...(plugin.profile_sections ?? []));
    if (!loginConfig && plugin.login_config) loginConfig = plugin.login_config;
    if (!signupConfig && plugin.signup_config) signupConfig = plugin.signup_config;
  }

  return { navItems, settingsPages, profileSections, loginConfig, signupConfig, isLoading: query.isLoading };
}
