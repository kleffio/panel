package ports

import (
	"context"

	"github.com/kleffio/platform/internal/core/plugins/domain"
)

// PluginRegistry fetches and caches the remote plugin catalog.
type PluginRegistry interface {
	// ListCatalog returns all plugins in the cached catalog.
	// Fetches from the remote URL on first call and caches with the configured TTL.
	ListCatalog(ctx context.Context) ([]*domain.CatalogManifest, error)

	// GetManifest returns the catalog entry for the given plugin ID.
	// Returns nil, nil if not found.
	GetManifest(ctx context.Context, pluginID string) (*domain.CatalogManifest, error)

	// Refresh forces a re-fetch of the active registry's catalog.
	Refresh(ctx context.Context) error

	// CachedAt returns the timestamp of the last successful catalog fetch.
	// Returns the zero time if the catalog has never been fetched.
	CachedAt() string // RFC3339 or ""
}

// RegistrySyncer is implemented by registry adapters that support DB-backed per-registry sync.
// Use a type assertion to access these methods when available.
type RegistrySyncer interface {
	// SyncForRegistry fetches the catalog from url and persists it under registryID in the DB.
	// Does not update the in-memory cache (safe to call for non-active registries).
	SyncForRegistry(ctx context.Context, registryID, url string) error

	// InvalidateCache clears the in-memory catalog cache, forcing a reload from DB on next access.
	InvalidateCache()
}

// RegistryConflictLister is implemented by registry adapters that support
// multi-registry conflict detection. Use a type assertion to access this.
type RegistryConflictLister interface {
	// ListConflicts returns all plugin IDs that appear in multiple enabled registries.
	ListConflicts(ctx context.Context) ([]domain.PluginConflict, error)
}
