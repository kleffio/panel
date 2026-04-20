"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSetupCatalog } from "@/features/setup/api";
import type { CatalogPlugin } from "@/features/setup/model/types";

export function useSetupCatalog() {
  const router = useRouter();
  const [bundledPlugins, setBundledPlugins] = useState<CatalogPlugin[]>([]);
  const [oidcPlugin, setOidcPlugin] = useState<CatalogPlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSetupCatalog()
      .then(({ plugins, redirectToLogin }) => {
        if (redirectToLogin) {
          router.replace("/auth/login");
          return;
        }
        const idpPlugins = plugins.filter((p) => p.type === "idp");
        setOidcPlugin(idpPlugins.find((p) => p.id === "idp-oidc") ?? null);
        setBundledPlugins(idpPlugins.filter((p) => p.id !== "idp-oidc"));
      })
      .catch(() => setError("Failed to load plugin catalog."))
      .finally(() => setLoading(false));
  }, [router]);

  return { bundledPlugins, oidcPlugin, loading, error };
}
