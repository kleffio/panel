package registry

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/kleffio/platform/internal/core/plugins/domain"
	"github.com/kleffio/platform/internal/core/plugins/ports"
)

const dbMemCacheTTL = 5 * time.Minute

// DBRegistry implements ports.PluginRegistry using the database as a persistent catalog cache.
// An in-memory layer (5-minute TTL) sits in front of the DB to reduce read pressure.
// It also implements ports.RegistrySyncer for per-registry sync operations.
type DBRegistry struct {
	store      ports.PluginStore
	defaultURL string
	client     *http.Client

	mu       sync.RWMutex
	catalog  []*domain.CatalogManifest
	cachedAt time.Time
}

// NewDBRegistry creates a DBRegistry. defaultURL is used to seed the first registry
// when the database has no entries yet; falls back to the official registry if empty.
func NewDBRegistry(store ports.PluginStore, defaultURL string) *DBRegistry {
	if defaultURL == "" {
		defaultURL = defaultCatalogURL
	}
	return &DBRegistry{
		store:      store,
		defaultURL: defaultURL,
		client:     &http.Client{Timeout: 15 * time.Second},
	}
}

var _ ports.PluginRegistry = (*DBRegistry)(nil)
var _ ports.RegistrySyncer = (*DBRegistry)(nil)
var _ ports.RegistryConflictLister = (*DBRegistry)(nil)

// EnsureDefault seeds the official registry if the database has no registry rows yet.
// Non-fatal: startup continues even if the initial catalog fetch fails.
func (r *DBRegistry) EnsureDefault(ctx context.Context) error {
	regs, err := r.store.ListRegistries(ctx)
	if err != nil {
		return fmt.Errorf("plugin registry: ensure default: %w", err)
	}
	if len(regs) > 0 {
		return nil
	}

	id, err := generateRegistryID()
	if err != nil {
		return fmt.Errorf("plugin registry: ensure default: generate id: %w", err)
	}
	reg := &domain.PluginRegistryConfig{
		ID:       id,
		Name:     "Official Registry",
		URL:      r.defaultURL,
		IsActive: true,
	}
	if err := r.store.SaveRegistry(ctx, reg); err != nil {
		return fmt.Errorf("plugin registry: ensure default: save: %w", err)
	}

	// Pre-fetch catalog — log but don't fail if the upstream is unreachable.
	_ = r.syncForRegistry(ctx, id, r.defaultURL)
	return nil
}

// ListCatalog returns the merged catalog (builtins + all enabled registries).
// When a plugin ID appears in multiple registries, the admin preference wins;
// if no preference exists, the oldest registry (by created_at) wins.
func (r *DBRegistry) ListCatalog(ctx context.Context) ([]*domain.CatalogManifest, error) {
	r.mu.RLock()
	if r.catalog != nil && time.Since(r.cachedAt) < dbMemCacheTTL {
		result := r.mergeWithBuiltins(r.catalog)
		r.mu.RUnlock()
		return result, nil
	}
	r.mu.RUnlock()

	merged, err := r.buildMergedCatalog(ctx)
	if err != nil {
		// Return stale in-memory data rather than an error.
		r.mu.RLock()
		stale := r.catalog
		r.mu.RUnlock()
		return r.mergeWithBuiltins(stale), nil
	}

	r.mu.Lock()
	r.catalog = merged
	r.cachedAt = time.Now()
	r.mu.Unlock()

	return r.mergeWithBuiltins(merged), nil
}

// buildMergedCatalog fetches catalogs from all enabled registries and merges them,
// using preferences to resolve ID conflicts.
func (r *DBRegistry) buildMergedCatalog(ctx context.Context) ([]*domain.CatalogManifest, error) {
	regs, err := r.store.ListEnabledRegistries(ctx)
	if err != nil || len(regs) == 0 {
		return nil, err
	}

	allCatalogs, err := r.store.GetAllCachedCatalogs(ctx)
	if err != nil {
		return nil, err
	}

	// If nothing cached at all, try a live sync of the first registry.
	totalCached := 0
	for _, v := range allCatalogs {
		totalCached += len(v)
	}
	if totalCached == 0 && len(regs) > 0 {
		// Sync the first enabled registry live.
		if syncErr := r.syncForRegistry(ctx, regs[0].ID, regs[0].URL); syncErr != nil {
			return nil, syncErr
		}
		allCatalogs, err = r.store.GetAllCachedCatalogs(ctx)
		if err != nil {
			return nil, err
		}
	}

	prefs, err := r.store.ListRegistryPreferences(ctx)
	if err != nil {
		return nil, err
	}
	prefMap := make(map[string]string, len(prefs))
	for _, p := range prefs {
		prefMap[p.PluginID] = p.RegistryID
	}

	// Merge: iterate registries in creation order (oldest first).
	// For each plugin, first registry wins unless a preference overrides it.
	seen := make(map[string]string) // pluginID → registryID that provided it
	var merged []*domain.CatalogManifest

	// First pass: collect which registry each plugin comes from (oldest first).
	for _, reg := range regs {
		for _, m := range allCatalogs[reg.ID] {
			if _, exists := seen[m.ID]; !exists {
				seen[m.ID] = reg.ID
			}
		}
	}

	// Apply preferences: override the selected registry for plugins with explicit prefs.
	for pluginID, prefRegID := range prefMap {
		if _, ok := seen[pluginID]; ok {
			// Verify the preferred registry actually has this plugin.
			for _, m := range allCatalogs[prefRegID] {
				if m.ID == pluginID {
					seen[pluginID] = prefRegID
					break
				}
			}
		}
	}

	// Second pass: build the final manifest list using the chosen registries.
	added := make(map[string]bool)
	for _, reg := range regs {
		for _, m := range allCatalogs[reg.ID] {
			if added[m.ID] {
				continue
			}
			if seen[m.ID] == reg.ID {
				merged = append(merged, m)
				added[m.ID] = true
			}
		}
	}

	return merged, nil
}

// GetManifest returns the catalog entry for pluginID, or nil, nil if not found.
func (r *DBRegistry) GetManifest(ctx context.Context, pluginID string) (*domain.CatalogManifest, error) {
	for _, b := range builtinCatalog {
		if b.ID == pluginID {
			return b, nil
		}
	}
	catalog, err := r.ListCatalog(ctx)
	if err != nil {
		return nil, err
	}
	for _, m := range catalog {
		if m.ID == pluginID {
			return m, nil
		}
	}
	return nil, nil
}

// Refresh forces a re-fetch of all enabled registries' catalogs.
func (r *DBRegistry) Refresh(ctx context.Context) error {
	regs, err := r.store.ListEnabledRegistries(ctx)
	if err != nil {
		return fmt.Errorf("plugin registry: list enabled: %w", err)
	}
	if len(regs) == 0 {
		return fmt.Errorf("plugin registry: no enabled registries configured")
	}
	var lastErr error
	for _, reg := range regs {
		if err := r.syncForRegistry(ctx, reg.ID, reg.URL); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

// SyncForRegistry implements ports.RegistrySyncer.
// Fetches from url and persists the catalog under registryID in the DB.
// Does not touch the in-memory cache (safe for non-active registries).
func (r *DBRegistry) SyncForRegistry(ctx context.Context, registryID, url string) error {
	manifests, err := r.fetchURL(ctx, url)
	if err != nil {
		return err
	}
	return r.store.UpsertCatalogCache(ctx, registryID, manifests)
}

// InvalidateCache implements ports.RegistrySyncer.
// Clears the in-memory catalog, forcing a reload from DB on the next ListCatalog call.
func (r *DBRegistry) InvalidateCache() {
	r.mu.Lock()
	r.catalog = nil
	r.cachedAt = time.Time{}
	r.mu.Unlock()
}

// CachedAt returns the RFC3339 timestamp of the last in-memory cache update, or "".
func (r *DBRegistry) CachedAt() string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if r.cachedAt.IsZero() {
		return ""
	}
	return r.cachedAt.UTC().Format(time.RFC3339)
}

// ListConflicts returns all plugin IDs that appear in multiple enabled registries.
func (r *DBRegistry) ListConflicts(ctx context.Context) ([]domain.PluginConflict, error) {
	regs, err := r.store.ListEnabledRegistries(ctx)
	if err != nil {
		return nil, err
	}
	if len(regs) < 2 {
		return nil, nil
	}

	allCatalogs, err := r.store.GetAllCachedCatalogs(ctx)
	if err != nil {
		return nil, err
	}

	regNameMap := make(map[string]string, len(regs))
	for _, reg := range regs {
		regNameMap[reg.ID] = reg.Name
	}

	prefs, err := r.store.ListRegistryPreferences(ctx)
	if err != nil {
		return nil, err
	}
	prefMap := make(map[string]string, len(prefs))
	for _, p := range prefs {
		prefMap[p.PluginID] = p.RegistryID
	}

	// pluginID → []ConflictSource
	type pluginInfo struct {
		name    string
		sources []domain.ConflictSource
	}
	conflicts := make(map[string]*pluginInfo)

	for _, reg := range regs {
		for _, m := range allCatalogs[reg.ID] {
			if _, ok := conflicts[m.ID]; !ok {
				conflicts[m.ID] = &pluginInfo{name: m.Name}
			}
			conflicts[m.ID].sources = append(conflicts[m.ID].sources, domain.ConflictSource{
				RegistryID:   reg.ID,
				RegistryName: regNameMap[reg.ID],
				Version:      m.Version,
				Author:       m.Author,
			})
		}
	}

	// Filter to only plugins in multiple registries.
	var out []domain.PluginConflict
	for pluginID, info := range conflicts {
		if len(info.sources) < 2 {
			continue
		}
		out = append(out, domain.PluginConflict{
			PluginID:            pluginID,
			PluginName:          info.name,
			Registries:          info.sources,
			PreferredRegistryID: prefMap[pluginID],
		})
	}
	return out, nil
}

// syncForRegistry fetches from url, updates the DB cache for registryID, and warms in-memory.
func (r *DBRegistry) syncForRegistry(ctx context.Context, registryID, url string) error {
	manifests, err := r.fetchURL(ctx, url)
	if err != nil {
		return err
	}
	if err := r.store.UpsertCatalogCache(ctx, registryID, manifests); err != nil {
		return fmt.Errorf("plugin registry: upsert cache: %w", err)
	}
	// Invalidate in-memory so next ListCatalog re-merges from all registries.
	r.mu.Lock()
	r.catalog = nil
	r.cachedAt = time.Time{}
	r.mu.Unlock()
	return nil
}

func (r *DBRegistry) fetchURL(ctx context.Context, url string) ([]*domain.CatalogManifest, error) {
	var body []byte
	if strings.HasPrefix(url, "file://") {
		path := strings.TrimPrefix(url, "file://")
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("plugin registry: read file: %w", err)
		}
		body = data
	} else {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, fmt.Errorf("plugin registry: build request: %w", err)
		}
		resp, err := r.client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("plugin registry: fetch: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("plugin registry: unexpected status %d", resp.StatusCode)
		}
		data, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
		if err != nil {
			return nil, fmt.Errorf("plugin registry: read body: %w", err)
		}
		body = data
	}
	var manifests []*domain.CatalogManifest
	if err := json.Unmarshal(body, &manifests); err != nil {
		return nil, fmt.Errorf("plugin registry: parse catalog: %w", err)
	}
	return manifests, nil
}

func (r *DBRegistry) mergeWithBuiltins(remote []*domain.CatalogManifest) []*domain.CatalogManifest {
	builtinIDs := make(map[string]struct{}, len(builtinCatalog))
	for _, b := range builtinCatalog {
		builtinIDs[b.ID] = struct{}{}
	}
	merged := make([]*domain.CatalogManifest, 0, len(builtinCatalog)+len(remote))
	merged = append(merged, builtinCatalog...)
	for _, m := range remote {
		if _, isBuiltin := builtinIDs[m.ID]; !isBuiltin {
			merged = append(merged, m)
		}
	}
	return merged
}

func generateRegistryID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", b), nil
}
