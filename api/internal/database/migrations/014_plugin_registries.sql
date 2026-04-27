CREATE TABLE IF NOT EXISTS plugin_registries (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    url             TEXT NOT NULL UNIQUE,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    last_synced_at  TIMESTAMPTZ,
    cooldown_until  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_catalog_cache (
    registry_id TEXT NOT NULL REFERENCES plugin_registries(id) ON DELETE CASCADE,
    plugin_id   TEXT NOT NULL,
    manifest    JSONB NOT NULL,
    cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (registry_id, plugin_id)
);
