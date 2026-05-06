"use client";

import { useState } from "react";
import { installSetupPlugin } from "@/features/setup/api";
import type { CatalogPlugin } from "@/features/setup/model/types";

export function useSetupInstall() {
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  function initConfig(plugin: CatalogPlugin) {
    const defaults: Record<string, string> = {};
    for (const field of plugin.config) {
      if (field.default) defaults[field.key] = field.default;
    }
    setConfigValues(defaults);
    setInstallError(null);
  }

  function setField(key: string, value: string) {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleInstall(e: React.FormEvent, selected: CatalogPlugin) {
    e.preventDefault();
    setInstalling(true);
    setInstallError(null);

    try {
      if (selected.dependencies && selected.dependencies.length > 0) {
        for (const depId of selected.dependencies) {
          await installSetupPlugin(depId, undefined, {});
        }
      }
      await installSetupPlugin(selected.id, selected.version, configValues);
      // Clear stale OIDC session so the login page doesn't auto-redirect
      // with the wrong identity (e.g. a previous IDP's token still in localStorage).
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("oidc.user:")) localStorage.removeItem(k);
      }
      window.location.replace("/auth/login");
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Installation failed.");
      setInstalling(false);
    }
  }

  return { configValues, installing, installError, initConfig, setField, handleInstall };
}
