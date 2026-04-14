"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast as sonnerToast } from "sonner";
import { PluginCtx, type PluginContext, type ToastOptions } from "@kleffio/sdk";
import { useCurrentUser } from "@/features/auth";
import { initPluginGlobals } from "@/lib/plugins/globals";
import { loadPluginScript } from "@/lib/plugins/loader";
import { pluginRegistry } from "@/lib/plugins/registry";
import { getInstalledPlugins } from "@/lib/api/plugins";

// ─── API client ───────────────────────────────────────────────────────────────

function buildApiClient(): PluginContext["api"] {
  const request = async <T,>(method: string, url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`[kleff/api] ${method} ${url} → ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  };

  return {
    get: <T,>(url: string) => request<T>("GET", url),
    post: <T, B>(url: string, body?: B) => request<T>("POST", url, body),
    put: <T, B>(url: string, body?: B) => request<T>("PUT", url, body),
    patch: <T, B>(url: string, body?: B) => request<T>("PATCH", url, body),
    del: <T,>(url: string) => request<T>("DELETE", url),
  };
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function buildStorage(pluginId: string): PluginContext["storage"] {
  const ns = `kleff:plugin:${pluginId}:`;
  return {
    get: <T,>(key: string): T | null => {
      try {
        const raw = localStorage.getItem(ns + key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    set: <T,>(key: string, value: T): void => {
      try {
        localStorage.setItem(ns + key, JSON.stringify(value));
      } catch {
        // Ignore storage errors (quota exceeded, private mode, etc.)
      }
    },
    remove: (key: string): void => {
      localStorage.removeItem(ns + key);
    },
  };
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function showToast(opts: ToastOptions): void {
  const message = opts.title ?? opts.description ?? "";
  const data = opts.description && opts.title ? { description: opts.description } : undefined;
  const duration = opts.duration;

  switch (opts.variant) {
    case "success":
      sonnerToast.success(message, { description: data?.description, duration });
      break;
    case "error":
      sonnerToast.error(message, { description: data?.description, duration });
      break;
    case "warning":
      sonnerToast.warning(message, { description: data?.description, duration });
      break;
    case "info":
      sonnerToast.info(message, { description: data?.description, duration });
      break;
    default:
      sonnerToast(message, { description: data?.description, duration });
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PluginContextProviderProps {
  children: ReactNode;
}

export function PluginContextProvider({ children }: PluginContextProviderProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  useEffect(() => {
    initPluginGlobals();
    getInstalledPlugins()
      .then(({ plugins }) => {
        const loads = plugins
          .filter((p) => p.enabled && p.frontend_url)
          .map((p) => loadPluginScript(p.frontend_url!).catch((err) => {
            console.error(`[kleff] Failed to load plugin script for "${p.id}":`, err);
          }));
        return Promise.all(loads);
      })
      .catch((err) => {
        console.error("[kleff] Failed to fetch installed plugins:", err);
      })
      .finally(() => {
        pluginRegistry.markSettled();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide a shared, namespaced storage — use "panel" as the id since the context
  // is shared. Plugins should call usePluginContext().storage with their own IDs.
  const sharedStorage = useMemo(() => buildStorage("panel"), []);
  const api = useMemo(() => buildApiClient(), []);

  const ctx = useMemo<PluginContext>(
    () => ({
      navigate: (path: string) => router.push(path),
      toast: showToast,
      currentUser: currentUser
        ? {
            userId: currentUser.userId,
            email: currentUser.email,
            roles: currentUser.roles ?? [],
          }
        : null,
      api,
      storage: sharedStorage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, router]
  );

  return <PluginCtx.Provider value={ctx}>{children}</PluginCtx.Provider>;
}
