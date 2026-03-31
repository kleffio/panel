"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast as sonnerToast } from "sonner";
import { PluginCtx, type PluginContext, type ToastOptions } from "@kleffio/sdk";
import { useCurrentUser } from "@/features/auth";
import { pluginRegistry } from "@/lib/plugins/registry";
import type { KleffPlugin } from "@kleffio/sdk";

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
  /** Static plugins loaded at build time from plugins.config.ts */
  plugins: KleffPlugin[];
}

export function PluginContextProvider({ children, plugins }: PluginContextProviderProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  // Register all static plugins once — pluginRegistry deduplicates by id
  for (const plugin of plugins) {
    pluginRegistry.register(plugin);
  }

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
