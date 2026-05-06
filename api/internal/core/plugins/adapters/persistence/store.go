package persistence

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/kleff/go-common/domain"
	plugindomain "github.com/kleffio/platform/internal/core/plugins/domain"
	"github.com/kleffio/platform/internal/core/plugins/ports"
)

// PostgresPluginStore implements ports.PluginStore against the plugins and
// settings tables (see migrations/003 and 004).
type PostgresPluginStore struct {
	db *sql.DB
}

// NewPostgresPluginStore creates the store. db may be nil during development;
// all methods gracefully no-op or return empty results.
func NewPostgresPluginStore(db *sql.DB) *PostgresPluginStore {
	return &PostgresPluginStore{db: db}
}

var _ ports.PluginStore = (*PostgresPluginStore)(nil)

// ── Plugins ───────────────────────────────────────────────────────────────────

func (s *PostgresPluginStore) FindByID(ctx context.Context, id string) (*plugindomain.Plugin, error) {
	if s.db == nil {
		return nil, domain.ErrNotFound
	}
	const q = `
		SELECT id, type, display_name, image, version, grpc_addr, frontend_url,
		       config, secrets, enabled, installed_at, updated_at, dependencies
		FROM plugins WHERE id = $1`
	return scanPlugin(s.db.QueryRowContext(ctx, q, id))
}

func (s *PostgresPluginStore) ListAll(ctx context.Context) ([]*plugindomain.Plugin, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT id, type, display_name, image, version, grpc_addr, frontend_url,
		       config, secrets, enabled, installed_at, updated_at, dependencies
		FROM plugins ORDER BY installed_at DESC`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("plugin store: list all: %w", err)
	}
	defer rows.Close()
	return scanPlugins(rows)
}

func (s *PostgresPluginStore) ListByType(ctx context.Context, pluginType string) ([]*plugindomain.Plugin, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT id, type, display_name, image, version, grpc_addr, frontend_url,
		       config, secrets, enabled, installed_at, updated_at, dependencies
		FROM plugins WHERE type = $1 ORDER BY installed_at DESC`
	rows, err := s.db.QueryContext(ctx, q, pluginType)
	if err != nil {
		return nil, fmt.Errorf("plugin store: list by type: %w", err)
	}
	defer rows.Close()
	return scanPlugins(rows)
}

func (s *PostgresPluginStore) Save(ctx context.Context, p *plugindomain.Plugin) error {
	if s.db == nil {
		return nil
	}
	const q = `
		INSERT INTO plugins
		    (id, type, display_name, image, version, grpc_addr, frontend_url,
		     config, secrets, enabled, installed_at, updated_at, dependencies)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (id) DO UPDATE SET
		    display_name  = EXCLUDED.display_name,
		    image         = EXCLUDED.image,
		    version       = EXCLUDED.version,
		    grpc_addr     = EXCLUDED.grpc_addr,
		    frontend_url  = EXCLUDED.frontend_url,
		    config        = EXCLUDED.config,
		    secrets       = EXCLUDED.secrets,
		    enabled       = EXCLUDED.enabled,
		    updated_at    = EXCLUDED.updated_at,
		    dependencies  = EXCLUDED.dependencies`

	var frontendURL sql.NullString
	if p.FrontendURL != "" {
		frontendURL = sql.NullString{String: p.FrontendURL, Valid: true}
	}

	depsJSON, err := json.Marshal(p.Dependencies)
	if err != nil {
		return fmt.Errorf("plugin store: marshal dependencies: %w", err)
	}

	_, err = s.db.ExecContext(ctx, q,
		p.ID, p.Type, p.DisplayName, p.Image, p.Version, p.GRPCAddr, frontendURL,
		json.RawMessage(p.Config), json.RawMessage(p.Secrets),
		p.Enabled, p.InstalledAt, p.UpdatedAt, json.RawMessage(depsJSON),
	)
	if err != nil {
		return fmt.Errorf("plugin store: save %q: %w", p.ID, err)
	}
	return nil
}

func (s *PostgresPluginStore) Delete(ctx context.Context, id string) error {
	if s.db == nil {
		return nil
	}
	res, err := s.db.ExecContext(ctx, `DELETE FROM plugins WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("plugin store: delete %q: %w", id, err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// ── Settings ──────────────────────────────────────────────────────────────────

func (s *PostgresPluginStore) GetSetting(ctx context.Context, key string) (string, error) {
	if s.db == nil {
		return "", nil
	}
	var val string
	err := s.db.QueryRowContext(ctx,
		`SELECT value FROM settings WHERE key = $1`, key,
	).Scan(&val)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("plugin store: get setting %q: %w", key, err)
	}
	return val, nil
}

func (s *PostgresPluginStore) SetSetting(ctx context.Context, key, value string) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO settings (key, value) VALUES ($1, $2)
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
		key, value,
	)
	if err != nil {
		return fmt.Errorf("plugin store: set setting %q: %w", key, err)
	}
	return nil
}

// ── Scan helpers ──────────────────────────────────────────────────────────────

func scanPlugin(row *sql.Row) (*plugindomain.Plugin, error) {
	var (
		p           plugindomain.Plugin
		frontendURL sql.NullString
		config      []byte
		secrets     []byte
		deps        []byte
		installedAt time.Time
		updatedAt   time.Time
	)
	err := row.Scan(
		&p.ID, &p.Type, &p.DisplayName, &p.Image, &p.Version, &p.GRPCAddr, &frontendURL,
		&config, &secrets, &p.Enabled, &installedAt, &updatedAt, &deps,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan plugin: %w", err)
	}
	p.FrontendURL = frontendURL.String
	p.Config = json.RawMessage(config)
	p.Secrets = json.RawMessage(secrets)
	p.InstalledAt = installedAt.UTC()
	p.UpdatedAt = updatedAt.UTC()
	p.Status = plugindomain.PluginStatusUnknown
	if len(deps) > 0 {
		_ = json.Unmarshal(deps, &p.Dependencies)
	}
	return &p, nil
}

func scanPlugins(rows *sql.Rows) ([]*plugindomain.Plugin, error) {
	var out []*plugindomain.Plugin
	for rows.Next() {
		var (
			p           plugindomain.Plugin
			frontendURL sql.NullString
			config      []byte
			secrets     []byte
			deps        []byte
			installedAt time.Time
			updatedAt   time.Time
		)
		err := rows.Scan(
			&p.ID, &p.Type, &p.DisplayName, &p.Image, &p.Version, &p.GRPCAddr, &frontendURL,
			&config, &secrets, &p.Enabled, &installedAt, &updatedAt, &deps,
		)
		if err != nil {
			return nil, fmt.Errorf("scan plugin: %w", err)
		}
		p.FrontendURL = frontendURL.String
		p.Config = json.RawMessage(config)
		p.Secrets = json.RawMessage(secrets)
		p.InstalledAt = installedAt.UTC()
		p.UpdatedAt = updatedAt.UTC()
		p.Status = plugindomain.PluginStatusUnknown
		if len(deps) > 0 {
			_ = json.Unmarshal(deps, &p.Dependencies)
		}
		out = append(out, &p)
	}
	return out, rows.Err()
}

// ── Registry management ───────────────────────────────────────────────────────

func (s *PostgresPluginStore) ListRegistries(ctx context.Context) ([]*plugindomain.PluginRegistryConfig, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT id, name, url, is_active, last_synced_at, cooldown_until, created_at, updated_at
		FROM plugin_registries ORDER BY created_at`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("plugin store: list registries: %w", err)
	}
	defer rows.Close()
	var out []*plugindomain.PluginRegistryConfig
	for rows.Next() {
		r, err := scanRegistry(rows.Scan)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PostgresPluginStore) GetActiveRegistry(ctx context.Context) (*plugindomain.PluginRegistryConfig, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT id, name, url, is_active, last_synced_at, cooldown_until, created_at, updated_at
		FROM plugin_registries WHERE is_active = true LIMIT 1`
	r, err := scanRegistryRow(s.db.QueryRowContext(ctx, q))
	if err == domain.ErrNotFound {
		return nil, nil
	}
	return r, err
}

func (s *PostgresPluginStore) GetRegistryByID(ctx context.Context, id string) (*plugindomain.PluginRegistryConfig, error) {
	if s.db == nil {
		return nil, domain.ErrNotFound
	}
	const q = `
		SELECT id, name, url, is_active, last_synced_at, cooldown_until, created_at, updated_at
		FROM plugin_registries WHERE id = $1`
	return scanRegistryRow(s.db.QueryRowContext(ctx, q, id))
}

func (s *PostgresPluginStore) SaveRegistry(ctx context.Context, r *plugindomain.PluginRegistryConfig) error {
	if s.db == nil {
		return nil
	}
	const q = `
		INSERT INTO plugin_registries (id, name, url, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name       = EXCLUDED.name,
			url        = EXCLUDED.url,
			is_active  = EXCLUDED.is_active,
			updated_at = NOW()`
	_, err := s.db.ExecContext(ctx, q, r.ID, r.Name, r.URL, r.IsActive)
	if err != nil {
		return fmt.Errorf("plugin store: save registry %q: %w", r.ID, err)
	}
	return nil
}

func (s *PostgresPluginStore) DeleteRegistry(ctx context.Context, id string) error {
	if s.db == nil {
		return nil
	}
	res, err := s.db.ExecContext(ctx, `DELETE FROM plugin_registries WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("plugin store: delete registry %q: %w", id, err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (s *PostgresPluginStore) SetActiveRegistry(ctx context.Context, id string) error {
	if s.db == nil {
		return nil
	}
	res, err := s.db.ExecContext(ctx,
		`UPDATE plugin_registries SET is_active = (id = $1), updated_at = NOW()`, id)
	if err != nil {
		return fmt.Errorf("plugin store: set active registry %q: %w", id, err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (s *PostgresPluginStore) UpdateRegistrySyncMeta(ctx context.Context, id string, syncedAt time.Time, cooldownUntil *time.Time) error {
	if s.db == nil {
		return nil
	}
	// When cooldownUntil is nil, COALESCE keeps the existing DB value unchanged.
	const q = `
		UPDATE plugin_registries
		SET last_synced_at = $2,
		    cooldown_until = COALESCE($3::timestamptz, cooldown_until),
		    updated_at     = NOW()
		WHERE id = $1`
	var cu interface{}
	if cooldownUntil != nil {
		cu = *cooldownUntil
	}
	_, err := s.db.ExecContext(ctx, q, id, syncedAt, cu)
	if err != nil {
		return fmt.Errorf("plugin store: update registry sync meta %q: %w", id, err)
	}
	return nil
}

// ── Catalog cache ─────────────────────────────────────────────────────────────

func (s *PostgresPluginStore) GetCachedCatalog(ctx context.Context, registryID string) ([]*plugindomain.CatalogManifest, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `SELECT manifest FROM plugin_catalog_cache WHERE registry_id = $1 ORDER BY plugin_id`
	rows, err := s.db.QueryContext(ctx, q, registryID)
	if err != nil {
		return nil, fmt.Errorf("plugin store: get cached catalog: %w", err)
	}
	defer rows.Close()
	var out []*plugindomain.CatalogManifest
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, fmt.Errorf("plugin store: scan cached manifest: %w", err)
		}
		var m plugindomain.CatalogManifest
		if err := json.Unmarshal(raw, &m); err != nil {
			continue // skip malformed entries
		}
		out = append(out, &m)
	}
	return out, rows.Err()
}

func (s *PostgresPluginStore) UpsertCatalogCache(ctx context.Context, registryID string, manifests []*plugindomain.CatalogManifest) error {
	if s.db == nil {
		return nil
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("plugin store: upsert catalog cache: begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	if _, err := tx.ExecContext(ctx, `DELETE FROM plugin_catalog_cache WHERE registry_id = $1`, registryID); err != nil {
		return fmt.Errorf("plugin store: upsert catalog cache: delete: %w", err)
	}

	const ins = `INSERT INTO plugin_catalog_cache (registry_id, plugin_id, manifest, cached_at) VALUES ($1, $2, $3, NOW())`
	for _, m := range manifests {
		raw, err := json.Marshal(m)
		if err != nil {
			return fmt.Errorf("plugin store: upsert catalog cache: marshal %q: %w", m.ID, err)
		}
		if _, err := tx.ExecContext(ctx, ins, registryID, m.ID, raw); err != nil {
			return fmt.Errorf("plugin store: upsert catalog cache: insert %q: %w", m.ID, err)
		}
	}
	return tx.Commit()
}

// ── Registry scan helpers ─────────────────────────────────────────────────────

func scanRegistryRow(row *sql.Row) (*plugindomain.PluginRegistryConfig, error) {
	var (
		r             plugindomain.PluginRegistryConfig
		lastSyncedAt  sql.NullTime
		cooldownUntil sql.NullTime
	)
	err := row.Scan(
		&r.ID, &r.Name, &r.URL, &r.IsActive,
		&lastSyncedAt, &cooldownUntil,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan registry: %w", err)
	}
	if lastSyncedAt.Valid {
		t := lastSyncedAt.Time.UTC()
		r.LastSyncedAt = &t
	}
	if cooldownUntil.Valid {
		t := cooldownUntil.Time.UTC()
		r.CooldownUntil = &t
	}
	r.CreatedAt = r.CreatedAt.UTC()
	r.UpdatedAt = r.UpdatedAt.UTC()
	return &r, nil
}

// scanRegistry is the rows.Next variant — takes the Scan method as a func parameter.
func scanRegistry(scan func(dest ...any) error) (*plugindomain.PluginRegistryConfig, error) {
	var (
		r             plugindomain.PluginRegistryConfig
		lastSyncedAt  sql.NullTime
		cooldownUntil sql.NullTime
	)
	if err := scan(
		&r.ID, &r.Name, &r.URL, &r.IsActive,
		&lastSyncedAt, &cooldownUntil,
		&r.CreatedAt, &r.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("scan registry: %w", err)
	}
	if lastSyncedAt.Valid {
		t := lastSyncedAt.Time.UTC()
		r.LastSyncedAt = &t
	}
	if cooldownUntil.Valid {
		t := cooldownUntil.Time.UTC()
		r.CooldownUntil = &t
	}
	r.CreatedAt = r.CreatedAt.UTC()
	r.UpdatedAt = r.UpdatedAt.UTC()
	return &r, nil
}

// ── Multi-registry support ────────────────────────────────────────────────────

func (s *PostgresPluginStore) ListEnabledRegistries(ctx context.Context) ([]*plugindomain.PluginRegistryConfig, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT id, name, url, is_active, last_synced_at, cooldown_until, created_at, updated_at
		FROM plugin_registries WHERE is_active = true ORDER BY created_at`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("plugin store: list enabled registries: %w", err)
	}
	defer rows.Close()
	var out []*plugindomain.PluginRegistryConfig
	for rows.Next() {
		r, err := scanRegistry(rows.Scan)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *PostgresPluginStore) GetAllCachedCatalogs(ctx context.Context) (map[string][]*plugindomain.CatalogManifest, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `
		SELECT c.registry_id, c.manifest
		FROM plugin_catalog_cache c
		JOIN plugin_registries r ON r.id = c.registry_id
		WHERE r.is_active = true
		ORDER BY r.created_at, c.plugin_id`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("plugin store: get all cached catalogs: %w", err)
	}
	defer rows.Close()
	out := make(map[string][]*plugindomain.CatalogManifest)
	for rows.Next() {
		var regID string
		var raw []byte
		if err := rows.Scan(&regID, &raw); err != nil {
			return nil, fmt.Errorf("plugin store: scan cached catalog: %w", err)
		}
		var m plugindomain.CatalogManifest
		if err := json.Unmarshal(raw, &m); err != nil {
			continue // skip malformed entries
		}
		out[regID] = append(out[regID], &m)
	}
	return out, rows.Err()
}

// ── Registry preferences (conflict resolution) ───────────────────────────────

func (s *PostgresPluginStore) ListRegistryPreferences(ctx context.Context) ([]*plugindomain.RegistryPreference, error) {
	if s.db == nil {
		return nil, nil
	}
	const q = `SELECT plugin_id, registry_id, created_at FROM plugin_registry_preferences ORDER BY created_at`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("plugin store: list registry preferences: %w", err)
	}
	defer rows.Close()
	var out []*plugindomain.RegistryPreference
	for rows.Next() {
		var p plugindomain.RegistryPreference
		if err := rows.Scan(&p.PluginID, &p.RegistryID, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("plugin store: scan registry preference: %w", err)
		}
		p.CreatedAt = p.CreatedAt.UTC()
		out = append(out, &p)
	}
	return out, rows.Err()
}

func (s *PostgresPluginStore) SetRegistryPreference(ctx context.Context, pluginID, registryID string) error {
	if s.db == nil {
		return nil
	}
	const q = `
		INSERT INTO plugin_registry_preferences (plugin_id, registry_id, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (plugin_id) DO UPDATE SET
			registry_id = EXCLUDED.registry_id,
			created_at  = NOW()`
	_, err := s.db.ExecContext(ctx, q, pluginID, registryID)
	if err != nil {
		return fmt.Errorf("plugin store: set registry preference %q: %w", pluginID, err)
	}
	return nil
}

func (s *PostgresPluginStore) DeleteRegistryPreference(ctx context.Context, pluginID string) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM plugin_registry_preferences WHERE plugin_id = $1`, pluginID)
	if err != nil {
		return fmt.Errorf("plugin store: delete registry preference %q: %w", pluginID, err)
	}
	return nil
}
