export interface RuntimeRequirement {
  runtime: "java" | "node" | "python" | "go" | "none";
  version: string;
  label: string;
}

export function getRequiredRuntime(crateId: string, gameVersion: string): RuntimeRequirement {
  const id = crateId.toLowerCase();

  if (isMinecraftRelated(id)) {
    return resolveJavaForMinecraft(gameVersion);
  }
  if (/node|next|react|vue|angular|express|nuxt|vite/.test(id)) {
    return { runtime: "node", version: "20", label: "Node.js 20 LTS" };
  }
  if (/python|django|flask|fastapi/.test(id)) {
    return { runtime: "python", version: "3.11", label: "Python 3.11" };
  }
  if (/\bgo\b|golang/.test(id)) {
    return { runtime: "go", version: "1.22", label: "Go 1.22" };
  }
  return { runtime: "none", version: "", label: "" };
}

export function isMinecraftRelated(crateId: string): boolean {
  return /minecraft|paper|purpur|spigot|bukkit|fabric|forge|neoforge|bedrock/.test(
    crateId.toLowerCase(),
  );
}

/** Fallback table used when the Mojang API is unavailable. */
function resolveJavaForMinecraft(mcVersion: string): RuntimeRequirement {
  const parts = mcVersion.replace(/[^0-9.]/g, "").split(".");
  const major = parseInt(parts[0] ?? "0", 10);
  const minor = parseInt(parts[1] ?? "0", 10);

  if (major > 1 || (major === 1 && minor >= 21)) {
    return { runtime: "java", version: "21", label: "Java 21" };
  }
  if (major === 1 && minor >= 17) {
    return { runtime: "java", version: "17", label: "Java 17" };
  }
  if (major === 1 && minor >= 13) {
    return { runtime: "java", version: "11", label: "Java 11" };
  }
  return { runtime: "java", version: "8", label: "Java 8" };
}

/**
 * Fetches the exact Java version Mojang requires for a specific MC release.
 * Each version entry in the manifest carries a `url` pointing to a detailed
 * JSON with `javaVersion.majorVersion`.  Returns null on network failure so
 * callers can fall back to the static table.
 */
export async function fetchMinecraftJavaVersion(versionUrl: string): Promise<number | null> {
  try {
    const res = await fetch(versionUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const major = data?.javaVersion?.majorVersion;
    return typeof major === "number" ? major : null;
  } catch {
    return null;
  }
}

export function selectConstructForRuntime(
  constructs: Record<string, string>,
  requirement: RuntimeRequirement,
): string | null {
  const keys = Object.keys(constructs);
  if (keys.length === 0) return null;
  if (requirement.runtime === "none" || !requirement.version) return keys[0] ?? null;
  const match = keys.find((k) => k.toLowerCase().includes(requirement.version));
  return match ?? keys[0] ?? null;
}
