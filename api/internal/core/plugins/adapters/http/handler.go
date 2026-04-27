// Package http exposes the plugin marketplace REST API.
//
// Routes (all under /api/v1/admin/plugins, require admin role):
//
//	GET    /api/v1/admin/plugins/catalog                     – list remote plugin catalog
//	POST   /api/v1/admin/plugins/catalog/refresh             – force catalog refresh
//	GET    /api/v1/admin/plugins                             – list installed plugins
//	POST   /api/v1/admin/plugins                             – install a plugin
//	GET    /api/v1/admin/plugins/{id}                        – get a single plugin
//	PATCH  /api/v1/admin/plugins/{id}/config                 – update plugin config
//	POST   /api/v1/admin/plugins/{id}/enable                 – enable plugin
//	POST   /api/v1/admin/plugins/{id}/disable                – disable plugin
//	DELETE /api/v1/admin/plugins/{id}                        – remove plugin
//	GET    /api/v1/admin/plugins/{id}/status                 – live container/gRPC status
//	POST   /api/v1/admin/plugins/{id}/set-active             – set as active IDP
//
//	GET    /api/v1/admin/plugin-registries                   – list registry sources
//	POST   /api/v1/admin/plugin-registries                   – add registry source
//	DELETE /api/v1/admin/plugin-registries/{id}              – remove registry source
//	POST   /api/v1/admin/plugin-registries/{id}/toggle       – enable/disable registry
//	POST   /api/v1/admin/plugin-registries/{id}/refresh      – manual catalog refresh
//	GET    /api/v1/admin/plugin-registries/conflicts         – list plugin ID conflicts
//	POST   /api/v1/admin/plugin-registries/conflicts/resolve – resolve a conflict
//	GET    /api/v1/admin/plugin-registries/preferences       – list all preferences
//	DELETE /api/v1/admin/plugin-registries/preferences/{plugin_id} – reset preference
//
// Authenticated (any role):
//
//	GET    /api/v1/plugins/catalog  – marketplace catalog; admins see all, others see type=ui only
package http

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	commonhttp "github.com/kleff/go-common/adapters/http"
	"github.com/kleff/go-common/domain"
	plugindomain "github.com/kleffio/platform/internal/core/plugins/domain"
	"github.com/kleffio/platform/internal/core/plugins/ports"
	"github.com/kleffio/platform/internal/shared/middleware"
)

// Handler is the plugin marketplace HTTP handler.
type Handler struct {
	manager  ports.PluginManager
	registry ports.PluginRegistry
	logger   *slog.Logger
}

// NewHandler wires the marketplace handler.
func NewHandler(
	manager ports.PluginManager,
	registry ports.PluginRegistry,
	logger *slog.Logger,
) *Handler {
	return &Handler{manager: manager, registry: registry, logger: logger}
}

// RegisterPublicRoutes attaches authenticated-but-not-admin plugin routes.
func (h *Handler) RegisterPublicRoutes(r chi.Router) {
	r.Get("/api/v1/plugins/catalog", h.handleMarketplaceCatalog)
	r.Get("/api/v1/plugins/installed", h.handleListInstalledPublic)
}

// RegisterRoutes attaches all plugin routes to the provided router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/api/v1/admin/plugins/catalog", h.handleListCatalog)
	r.Post("/api/v1/admin/plugins/catalog/refresh", h.handleRefreshCatalog)
	r.Get("/api/v1/admin/plugins", h.handleListInstalled)
	r.Post("/api/v1/admin/plugins", h.handleInstall)
	r.Get("/api/v1/admin/plugins/{id}", h.handleGetPlugin)
	r.Patch("/api/v1/admin/plugins/{id}/config", h.handleConfigure)
	r.Post("/api/v1/admin/plugins/{id}/enable", h.handleEnable)
	r.Post("/api/v1/admin/plugins/{id}/disable", h.handleDisable)
	r.Delete("/api/v1/admin/plugins/{id}", h.handleRemove)
	r.Get("/api/v1/admin/plugins/{id}/status", h.handleStatus)
	r.Post("/api/v1/admin/plugins/{id}/set-active", h.handleSetActive)

	r.Get("/api/v1/admin/plugin-registries", h.handleListRegistries)
	r.Post("/api/v1/admin/plugin-registries", h.handleAddRegistry)
	r.Delete("/api/v1/admin/plugin-registries/{id}", h.handleDeleteRegistry)
	r.Post("/api/v1/admin/plugin-registries/{id}/toggle", h.handleToggleRegistry)
	r.Post("/api/v1/admin/plugin-registries/{id}/refresh", h.handleRefreshRegistry)
	r.Get("/api/v1/admin/plugin-registries/conflicts", h.handleListConflicts)
	r.Post("/api/v1/admin/plugin-registries/conflicts/resolve", h.handleResolveConflict)
	r.Get("/api/v1/admin/plugin-registries/preferences", h.handleListPreferences)
	r.Delete("/api/v1/admin/plugin-registries/preferences/{plugin_id}", h.handleResetPreference)
}

// ── Catalog ───────────────────────────────────────────────────────────────────

func (h *Handler) handleListCatalog(w http.ResponseWriter, r *http.Request) {
	catalog, err := h.registry.ListCatalog(r.Context())
	if err != nil {
		h.logger.Error("list catalog", "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.Success(w, map[string]any{
		"plugins":   catalog,
		"cached_at": h.registry.CachedAt(),
	})
}

// handleMarketplaceCatalog serves the plugin marketplace to all authenticated users.
// Admins receive the full catalog; everyone else receives only type=ui plugins.
func (h *Handler) handleMarketplaceCatalog(w http.ResponseWriter, r *http.Request) {
	catalog, err := h.registry.ListCatalog(r.Context())
	if err != nil {
		h.logger.Error("marketplace catalog", "error", err)
		commonhttp.Error(w, err)
		return
	}

	claims, _ := middleware.ClaimsFromContext(r.Context())
	isAdmin := false
	for _, role := range claims.Roles {
		if role == "admin" {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		filtered := catalog[:0]
		for _, p := range catalog {
			if p.Type == "ui" {
				filtered = append(filtered, p)
			}
		}
		catalog = filtered
	}

	commonhttp.Success(w, map[string]any{
		"plugins":   catalog,
		"cached_at": h.registry.CachedAt(),
	})
}

func (h *Handler) handleRefreshCatalog(w http.ResponseWriter, r *http.Request) {
	if err := h.registry.Refresh(r.Context()); err != nil {
		h.logger.Error("refresh catalog", "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.Success(w, map[string]string{"cached_at": h.registry.CachedAt()})
}

// ── Installed plugins ─────────────────────────────────────────────────────────

// handleListInstalledPublic serves installed plugins to any authenticated user.
// Admins receive all installed plugins; non-admins receive only type=ui plugins.
func (h *Handler) handleListInstalledPublic(w http.ResponseWriter, r *http.Request) {
	plugins, err := h.manager.ListPlugins(r.Context())
	if err != nil {
		h.logger.Error("list installed plugins (public)", "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}

	claims, _ := middleware.ClaimsFromContext(r.Context())
	isAdmin := false
	for _, role := range claims.Roles {
		if role == "admin" {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		filtered := plugins[:0]
		for _, p := range plugins {
			if p.Type == "ui" {
				filtered = append(filtered, p)
			}
		}
		plugins = filtered
	}

	activeID := h.manager.GetActiveIDPID()
	responses := toResponses(plugins)
	for i := range responses {
		if responses[i].ID == activeID {
			responses[i].IsActiveIDP = true
		}
	}
	commonhttp.Success(w, map[string]any{"plugins": responses})
}

func (h *Handler) handleListInstalled(w http.ResponseWriter, r *http.Request) {
	plugins, err := h.manager.ListPlugins(r.Context())
	if err != nil {
		h.logger.Error("list installed plugins", "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}
	activeID := h.manager.GetActiveIDPID()
	responses := toResponses(plugins)
	for i := range responses {
		if responses[i].ID == activeID {
			responses[i].IsActiveIDP = true
		}
	}
	commonhttp.Success(w, map[string]any{"plugins": responses})
}

func (h *Handler) handleGetPlugin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.manager.GetPlugin(r.Context(), id)
	if err != nil {
		commonhttp.Error(w, err)
		return
	}
	commonhttp.Success(w, toResponse(p))
}

// ── Install ───────────────────────────────────────────────────────────────────

type installRequest struct {
	ID      string            `json:"id"`
	Version string            `json:"version"`
	Config  map[string]string `json:"config"`
}

func (h *Handler) handleInstall(w http.ResponseWriter, r *http.Request) {
	var req installRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.Error(w, domain.NewBadRequest("invalid request body"))
		return
	}
	if req.ID == "" {
		commonhttp.Error(w, domain.NewBadRequest("id is required"))
		return
	}

	manifest, err := h.registry.GetManifest(r.Context(), req.ID)
	if err != nil {
		h.logger.Error("install: get manifest", "id", req.ID, "error", err)
		commonhttp.Error(w, err)
		return
	}
	if manifest == nil {
		commonhttp.Error(w, domain.NewBadRequest("plugin "+req.ID+" not found in catalog"))
		return
	}

	// Validate required fields.
	for _, field := range manifest.Config {
		if field.Required {
			if _, ok := req.Config[field.Key]; !ok {
				commonhttp.Error(w, domain.NewBadRequest("required config field missing: "+field.Key))
				return
			}
		}
	}

	// Use a detached context with a generous timeout for install.
	// Companion images (e.g. Keycloak ~400MB) can take minutes to pull
	// and must not be cancelled when the HTTP request completes.
	installCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	p, err := h.manager.Install(installCtx, manifest, req.Config)
	if err != nil {
		h.logger.Warn("install plugin failed", "id", req.ID, "error", err)
		commonhttp.Error(w, domain.NewBadRequest(err.Error()))
		return
	}
	commonhttp.Created(w, toResponse(p))
}

// ── Configure ─────────────────────────────────────────────────────────────────

type configureRequest struct {
	Config map[string]string `json:"config"`
}

func (h *Handler) handleConfigure(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req configureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.Error(w, domain.NewBadRequest("invalid request body"))
		return
	}

	if err := h.manager.Reconfigure(r.Context(), id, req.Config); err != nil {
		h.logger.Warn("configure plugin failed", "id", id, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

// ── Enable / Disable ──────────────────────────────────────────────────────────

func (h *Handler) handleEnable(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.manager.Enable(r.Context(), id); err != nil {
		h.logger.Warn("enable plugin failed", "id", id, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

func (h *Handler) handleDisable(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.manager.Disable(r.Context(), id); err != nil {
		h.logger.Warn("disable plugin failed", "id", id, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

// ── Remove ────────────────────────────────────────────────────────────────────

func (h *Handler) handleRemove(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.manager.Remove(r.Context(), id); err != nil {
		h.logger.Warn("remove plugin failed", "id", id, "error", err)
		commonhttp.Error(w, domain.NewBadRequest(err.Error()))
		return
	}
	commonhttp.NoContent(w)
}

// ── Status ────────────────────────────────────────────────────────────────────

func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.manager.GetPlugin(r.Context(), id)
	if err != nil {
		commonhttp.Error(w, err)
		return
	}
	commonhttp.Success(w, map[string]string{
		"id":     p.ID,
		"status": string(p.Status),
	})
}

// ── Set active IDP ────────────────────────────────────────────────────────────

func (h *Handler) handleSetActive(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.manager.SetActiveIDP(r.Context(), id); err != nil {
		h.logger.Warn("set active IDP failed", "id", id, "error", err)
		commonhttp.Error(w, domain.NewBadRequest(err.Error()))
		return
	}
	commonhttp.NoContent(w)
}

// ── Response mapping ──────────────────────────────────────────────────────────

type pluginResponse struct {
	ID          string                    `json:"id"`
	Type        string                    `json:"type"`
	DisplayName string                    `json:"display_name"`
	Image       string                    `json:"image"`
	Version     string                    `json:"version"`
	GRPCAddr    string                    `json:"grpc_addr"`
	FrontendURL string                    `json:"frontend_url"`
	Config      json.RawMessage           `json:"config"`
	Enabled     bool                      `json:"enabled"`
	Status      plugindomain.PluginStatus `json:"status"`
	InstalledAt string                    `json:"installed_at"`
	UpdatedAt   string                    `json:"updated_at"`
	IsActiveIDP bool                      `json:"is_active_idp"`
}

func toResponse(p *plugindomain.Plugin) pluginResponse {
	return pluginResponse{
		ID:          p.ID,
		Type:        p.Type,
		DisplayName: p.DisplayName,
		Image:       p.Image,
		Version:     p.Version,
		GRPCAddr:    p.GRPCAddr,
		FrontendURL: p.FrontendURL,
		Config:      p.Config, // secrets already stripped from Config field
		Enabled:     p.Enabled,
		Status:      p.Status,
		InstalledAt: p.InstalledAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   p.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toResponses(plugins []*plugindomain.Plugin) []pluginResponse {
	out := make([]pluginResponse, len(plugins))
	for i, p := range plugins {
		out[i] = toResponse(p)
	}
	return out
}

// ── Registry management ───────────────────────────────────────────────────────

func (h *Handler) handleListRegistries(w http.ResponseWriter, r *http.Request) {
	regs, err := h.manager.ListRegistries(r.Context())
	if err != nil {
		h.logger.Error("list registries", "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}
	commonhttp.Success(w, map[string]any{"registries": toRegistryResponses(regs)})
}

type addRegistryRequest struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

func (h *Handler) handleAddRegistry(w http.ResponseWriter, r *http.Request) {
	var req addRegistryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.Error(w, domain.NewBadRequest("invalid request body"))
		return
	}
	if req.Name == "" {
		commonhttp.Error(w, domain.NewBadRequest("name is required"))
		return
	}
	if req.URL == "" {
		commonhttp.Error(w, domain.NewBadRequest("url is required"))
		return
	}
	reg, err := h.manager.AddRegistry(r.Context(), req.Name, req.URL)
	if err != nil {
		h.logger.Warn("add registry failed", "error", err)
		commonhttp.Error(w, domain.NewBadRequest(err.Error()))
		return
	}
	commonhttp.Created(w, toRegistryResponse(reg))
}

func (h *Handler) handleDeleteRegistry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.manager.DeleteRegistry(r.Context(), id); err != nil {
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

func (h *Handler) handleToggleRegistry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.Error(w, domain.NewBadRequest("invalid request body"))
		return
	}
	if err := h.manager.ToggleRegistry(r.Context(), id, req.Enabled); err != nil {
		h.logger.Warn("toggle registry failed", "id", id, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

func (h *Handler) handleRefreshRegistry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.manager.RefreshRegistry(r.Context(), id)
	if err != nil {
		var ce *plugindomain.CooldownError
		if errors.As(err, &ce) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error":          ce.Error(),
				"cooldown_until": ce.Until.UTC().Format(time.RFC3339),
			})
			return
		}
		h.logger.Warn("refresh registry failed", "id", id, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.Success(w, map[string]string{"status": "ok"})
}

// ── Conflict resolution ───────────────────────────────────────────────────────

func (h *Handler) handleListConflicts(w http.ResponseWriter, r *http.Request) {
	conflicts, err := h.manager.ListConflicts(r.Context())
	if err != nil {
		h.logger.Error("list conflicts", "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}
	if conflicts == nil {
		conflicts = []plugindomain.PluginConflict{}
	}
	commonhttp.Success(w, map[string]any{"conflicts": conflicts})
}

func (h *Handler) handleResolveConflict(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PluginID   string `json:"plugin_id"`
		RegistryID string `json:"registry_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.Error(w, domain.NewBadRequest("invalid request body"))
		return
	}
	if req.PluginID == "" || req.RegistryID == "" {
		commonhttp.Error(w, domain.NewBadRequest("plugin_id and registry_id are required"))
		return
	}
	if err := h.manager.ResolveConflict(r.Context(), req.PluginID, req.RegistryID); err != nil {
		h.logger.Warn("resolve conflict failed", "error", err)
		commonhttp.Error(w, domain.NewBadRequest(err.Error()))
		return
	}
	commonhttp.NoContent(w)
}

func (h *Handler) handleListPreferences(w http.ResponseWriter, r *http.Request) {
	prefs, err := h.manager.ListRegistryPreferences(r.Context())
	if err != nil {
		h.logger.Error("list preferences", "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}
	if prefs == nil {
		prefs = []*plugindomain.RegistryPreference{}
	}
	commonhttp.Success(w, map[string]any{"preferences": prefs})
}

func (h *Handler) handleResetPreference(w http.ResponseWriter, r *http.Request) {
	pluginID := chi.URLParam(r, "plugin_id")
	if pluginID == "" {
		commonhttp.Error(w, domain.NewBadRequest("plugin_id is required"))
		return
	}
	if err := h.manager.ResetConflictPreference(r.Context(), pluginID); err != nil {
		h.logger.Warn("reset preference failed", "plugin_id", pluginID, "error", err)
		commonhttp.Error(w, err)
		return
	}
	commonhttp.NoContent(w)
}

// ── Registry response mapping ─────────────────────────────────────────────────

type registryResponse struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	URL           string  `json:"url"`
	IsActive      bool    `json:"is_active"`
	LastSyncedAt  *string `json:"last_synced_at"`
	CooldownUntil *string `json:"cooldown_until"`
	CreatedAt     string  `json:"created_at"`
}

func toRegistryResponse(r *plugindomain.PluginRegistryConfig) registryResponse {
	resp := registryResponse{
		ID:        r.ID,
		Name:      r.Name,
		URL:       r.URL,
		IsActive:  r.IsActive,
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
	}
	if r.LastSyncedAt != nil {
		s := r.LastSyncedAt.UTC().Format(time.RFC3339)
		resp.LastSyncedAt = &s
	}
	if r.CooldownUntil != nil && r.CooldownUntil.After(time.Now()) {
		s := r.CooldownUntil.UTC().Format(time.RFC3339)
		resp.CooldownUntil = &s
	}
	return resp
}

func toRegistryResponses(regs []*plugindomain.PluginRegistryConfig) []registryResponse {
	out := make([]registryResponse, len(regs))
	for i, r := range regs {
		out[i] = toRegistryResponse(r)
	}
	return out
}
