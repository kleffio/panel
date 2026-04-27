package ports

import (
	"context"
	"time"

	"github.com/kleffio/platform/internal/core/plugins/domain"
)

// PluginStore persists installed plugin records and the active-plugin settings.
// Schema: see migrations/003_create_plugins.sql and 004_create_settings.sql.
type PluginStore interface {
	// FindByID returns an installed plugin by its manifest ID.
	FindByID(ctx context.Context, id string) (*domain.Plugin, error)

	// ListAll returns every installed plugin.
	ListAll(ctx context.Context) ([]*domain.Plugin, error)

	// ListByType returns all installed plugins of the given type.
	ListByType(ctx context.Context, pluginType string) ([]*domain.Plugin, error)

	// Save upserts a plugin record (insert or update by ID).
	Save(ctx context.Context, p *domain.Plugin) error

	// Delete removes a plugin record by ID.
	Delete(ctx context.Context, id string) error

	// GetSetting returns the value of a named settings key.
	// Returns "", nil if the key does not exist.
	GetSetting(ctx context.Context, key string) (string, error)

	// SetSetting upserts a named settings key.
	SetSetting(ctx context.Context, key, value string) error

	// ── Registry management ───────────────────────────────────────────────────

	// ListRegistries returns all configured plugin registry sources ordered by creation time.
	ListRegistries(ctx context.Context) ([]*domain.PluginRegistryConfig, error)

	// GetActiveRegistry returns the currently active registry, or nil, nil if none is set.
	GetActiveRegistry(ctx context.Context) (*domain.PluginRegistryConfig, error)

	// GetRegistryByID returns the registry with the given ID.
	// Returns domain.ErrNotFound if it does not exist.
	GetRegistryByID(ctx context.Context, id string) (*domain.PluginRegistryConfig, error)

	// SaveRegistry upserts a registry record.
	SaveRegistry(ctx context.Context, r *domain.PluginRegistryConfig) error

	// DeleteRegistry removes a registry and its cached catalog (cascade).
	DeleteRegistry(ctx context.Context, id string) error

	// SetActiveRegistry atomically marks id as active and all others as inactive.
	SetActiveRegistry(ctx context.Context, id string) error

	// UpdateRegistrySyncMeta records the time of a successful sync and, optionally,
	// sets a cooldown expiry. Pass nil cooldownUntil to leave the existing value unchanged.
	UpdateRegistrySyncMeta(ctx context.Context, id string, syncedAt time.Time, cooldownUntil *time.Time) error

	// ── Catalog cache ─────────────────────────────────────────────────────────

	// GetCachedCatalog returns all manifests stored in the DB cache for registryID.
	GetCachedCatalog(ctx context.Context, registryID string) ([]*domain.CatalogManifest, error)

	// UpsertCatalogCache replaces the entire catalog cache for registryID in one transaction.
	UpsertCatalogCache(ctx context.Context, registryID string, manifests []*domain.CatalogManifest) error

	// ── Multi-registry support ────────────────────────────────────────────

	// ListEnabledRegistries returns all registries with is_active = true, ordered by created_at.
	ListEnabledRegistries(ctx context.Context) ([]*domain.PluginRegistryConfig, error)

	// GetAllCachedCatalogs returns cached manifests keyed by registry ID for all enabled registries.
	GetAllCachedCatalogs(ctx context.Context) (map[string][]*domain.CatalogManifest, error)

	// ── Registry preferences (conflict resolution) ────────────────────────

	// ListRegistryPreferences returns all saved per-plugin preferences.
	ListRegistryPreferences(ctx context.Context) ([]*domain.RegistryPreference, error)

	// SetRegistryPreference upserts an admin's preferred registry for a plugin.
	SetRegistryPreference(ctx context.Context, pluginID, registryID string) error

	// DeleteRegistryPreference removes the preference for a plugin (revert to auto).
	DeleteRegistryPreference(ctx context.Context, pluginID string) error
}
