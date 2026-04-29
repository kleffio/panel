package domain

import (
	"fmt"
	"time"
)

// PluginRegistryConfig is a registered plugin catalog source.
type PluginRegistryConfig struct {
	ID            string
	Name          string
	URL           string
	IsActive      bool
	LastSyncedAt  *time.Time
	CooldownUntil *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// CooldownError is returned when a registry refresh is requested while still on cooldown.
type CooldownError struct {
	Until time.Time
}

func (e *CooldownError) Error() string {
	return fmt.Sprintf("registry refresh on cooldown, retry after %s", e.Until.UTC().Format(time.RFC3339))
}

// Enabled is a semantic alias for IsActive under the multi-registry model.
// All enabled registries contribute plugins to the merged catalog.
func (r *PluginRegistryConfig) Enabled() bool { return r.IsActive }

// PluginConflict describes a plugin ID that appears in multiple enabled registries.
type PluginConflict struct {
	PluginID   string           `json:"plugin_id"`
	PluginName string           `json:"plugin_name"`
	Registries []ConflictSource `json:"registries"`
	// PreferredRegistryID is the ID of the registry the admin has chosen,
	// or "" if no preference has been set (auto = oldest registry wins).
	PreferredRegistryID string `json:"preferred_registry_id"`
}

// ConflictSource is one registry that provides a conflicting plugin.
type ConflictSource struct {
	RegistryID   string `json:"registry_id"`
	RegistryName string `json:"registry_name"`
	Version      string `json:"version"`
	Author       string `json:"author"`
}

// RegistryPreference records an admin's per-plugin registry choice.
type RegistryPreference struct {
	PluginID   string    `json:"plugin_id"`
	RegistryID string    `json:"registry_id"`
	CreatedAt  time.Time `json:"created_at"`
}
