-- Stores admin's per-plugin registry preference when the same plugin ID
-- appears in multiple registries.
CREATE TABLE IF NOT EXISTS plugin_registry_preferences (
    plugin_id   TEXT PRIMARY KEY,
    registry_id TEXT NOT NULL REFERENCES plugin_registries(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rename is_active → enabled semantics: all registries contribute to the
-- catalog by default. The column type stays boolean; we just reinterpret it.
-- No schema change needed — is_active already stores the right data type.
-- We add a comment for documentation only.
COMMENT ON COLUMN plugin_registries.is_active IS 'Whether this registry contributes plugins to the catalog. Renamed from single-active to multi-enabled model in migration 015.';
