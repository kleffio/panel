import type { CatalogPlugin } from "@/features/setup/model/types";

export async function fetchSetupCatalog(): Promise<{
  plugins: CatalogPlugin[];
  redirectToLogin?: boolean;
}> {
  const res = await fetch("/api/v1/setup/catalog", { cache: "no-store" });
  if (res.status === 403) {
    return { plugins: [], redirectToLogin: true };
  }
  const data = await res.json();
  return { plugins: data.data?.plugins ?? [] };
}

export async function installSetupPlugin(
  id: string,
  version: string | undefined,
  config: Record<string, string>
): Promise<void> {
  const res = await fetch("/api/v1/setup/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, version, config }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Installation failed.");
  }
}
