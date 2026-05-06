"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCatalog,
  getInstalledPlugins,
  getPlugin,
  installPlugin,
  uninstallPlugin,
  updatePluginConfig,
  setActiveIDP,
} from "@/lib/api/plugins";
import { clearStoredSession, broadcastSignout } from "@/features/auth";
import type { CatalogPlugin } from "@/lib/api/plugins";
import type { SheetMode } from "@/features/plugins/model/types";

export function useMarketplace() {
  const [plugins, setPlugins] = useState<CatalogPlugin[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [activeIDPId, setActiveIDPId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [configPlugin, setConfigPlugin] = useState<CatalogPlugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configError, setConfigError] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("install");
  const [saving, setSaving] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [alreadyInstalledActivate, setAlreadyInstalledActivate] = useState(false);

  const [depsPlugin, setDepsPlugin] = useState<CatalogPlugin | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [search, setSearch] = useState("");
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [filterOfficial, setFilterOfficial] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    getCatalog().then((r) => setPlugins(r.plugins ?? []));
    getInstalledPlugins().then((r) => {
      const installed = r.plugins ?? [];
      setInstalledIds(new Set(installed.map((p) => p.id)));
      const active = installed.find((p) => p.is_active_idp);
      if (active) setActiveIDPId(active.id);
    });
  }, []);

  const categories = useMemo(() => {
    const types = Array.from(new Set(plugins.map((p) => p.type)));
    return types.sort();
  }, [plugins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plugins.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterInstalled && !installedIds.has(p.id)) return false;
      if (filterOfficial && !p.verified) return false;
      if (filterCategory && p.type !== filterCategory) return false;
      return true;
    });
  }, [plugins, search, filterInstalled, filterOfficial, filterCategory, installedIds]);

  function extractError(err: any, fallback: string): string {
    return (err?.data as any)?.error ?? err?.message ?? fallback;
  }

  function withDepsCheck(plugin: CatalogPlugin, action: () => void) {
    const unmet = (plugin.dependencies ?? []).filter((d) => !installedIds.has(d));
    if (unmet.length > 0) {
      setDepsPlugin(plugin);
      setPendingAction(() => action);
    } else {
      action();
    }
  }

  function openSheet(plugin: CatalogPlugin, mode: SheetMode) {
    const defaults: Record<string, string> = {};
    for (const field of plugin.config ?? []) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setConfigError(null);
    setSheetMode(mode);
    setAdvancedMode(false);
    setConfigPlugin(plugin);
  }

  async function prefillEdit(plugin: CatalogPlugin) {
    const defaults: Record<string, string> = {};
    for (const field of plugin.config ?? []) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setConfigError(null);
    setSheetMode("edit");
    setAdvancedMode(false);
    setConfigPlugin(plugin);
    try {
      const detail = await getPlugin(plugin.id);
      setConfigValues((prev) => ({ ...prev, ...(detail.config ?? {}) }));
    } catch {
      // Proceed with defaults
    }
  }

  async function openActivate(plugin: CatalogPlugin) {
    setActionError(null);
    if (installedIds.has(plugin.id)) {
      setAlreadyInstalledActivate(true);
      const defaults: Record<string, string> = {};
      for (const field of plugin.config ?? []) {
        if (field.default) defaults[field.key] = field.default;
      }
      setConfigValues(defaults);
      setConfigError(null);
      setSheetMode("activate");
      setAdvancedMode(false);
      setConfigPlugin(plugin);
      try {
        const detail = await getPlugin(plugin.id);
        setConfigValues((prev) => ({ ...prev, ...(detail.config ?? {}) }));
      } catch {
        // Proceed with defaults
      }
    } else {
      setAlreadyInstalledActivate(false);
      openSheet(plugin, "activate");
    }
  }

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configPlugin) return;

    const fields = configPlugin.config ?? [];
    for (const field of fields) {
      if (field.required && !configValues[field.key]?.trim()) {
        setConfigError(`"${field.label}" is required.`);
        return;
      }
    }

    if (sheetMode === "edit") {
      setSaving(true);
      setConfigError(null);
      try {
        await updatePluginConfig(configPlugin.id, configValues);
        setConfigPlugin(null);
      } catch (err: any) {
        setConfigError(extractError(err, "Update failed."));
      } finally {
        setSaving(false);
      }
    } else if (sheetMode === "activate") {
      setActivating(configPlugin.id);
      setConfigError(null);
      try {
        if (!alreadyInstalledActivate) {
          await installPlugin(configPlugin.id, configValues);
          setInstalledIds((s) => new Set(s).add(configPlugin.id));
        }
        await setActiveIDP(configPlugin.id);
        clearStoredSession();
        broadcastSignout();
        window.location.href = "/auth/login";
      } catch (err: any) {
        setConfigError(extractError(err, "Activate failed."));
        setActivating(null);
      }
    } else {
      setInstalling(configPlugin.id);
      setConfigError(null);
      try {
        await installPlugin(configPlugin.id, configValues);
        window.location.reload();
      } catch (err: any) {
        setConfigError(extractError(err, "Install failed."));
      } finally {
        setInstalling(null);
      }
    }
  }

  async function handleUninstall(id: string) {
    setActionError(null);
    const dependents = plugins.filter(
      (p) => installedIds.has(p.id) && (p.dependencies ?? []).includes(id)
    );
    if (dependents.length > 0) {
      const names = dependents.map((p) => p.name).join(", ");
      setActionError(
        `Cannot uninstall: ${
          dependents.length === 1 ? names : `[${names}]`
        } depends on this plugin. Uninstall ${
          dependents.length === 1 ? "it" : "them"
        } first.`
      );
      return;
    }
    setUninstalling(id);
    try {
      await uninstallPlugin(id);
      window.location.reload();
    } catch (err: any) {
      setActionError(extractError(err, "Uninstall failed."));
    } finally {
      setUninstalling(null);
    }
  }

  const normalFields = useMemo(
    () => (configPlugin?.config ?? []).filter((f) => !f.advanced),
    [configPlugin]
  );
  const advancedFields = useMemo(
    () => (configPlugin?.config ?? []).filter((f) => f.advanced),
    [configPlugin]
  );
  const hasAdvancedFields = advancedFields.length > 0;

  return {
    plugins,
    installedIds,
    setInstalledIds,
    installing,
    uninstalling,
    activating,
    activeIDPId,
    actionError,
    configPlugin,
    setConfigPlugin,
    configValues,
    setConfigValues,
    configError,
    sheetMode,
    saving,
    advancedMode,
    setAdvancedMode,
    depsPlugin,
    setDepsPlugin,
    pendingAction,
    setPendingAction,
    search,
    setSearch,
    filterInstalled,
    setFilterInstalled,
    filterOfficial,
    setFilterOfficial,
    filterCategory,
    setFilterCategory,
    categories,
    filtered,
    normalFields,
    advancedFields,
    hasAdvancedFields,
    withDepsCheck,
    openSheet,
    prefillEdit,
    openActivate,
    handleConfigSubmit,
    handleUninstall,
  };
}
