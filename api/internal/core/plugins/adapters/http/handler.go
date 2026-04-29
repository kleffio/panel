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
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
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

// RegisterAnonymousRoutes attaches routes that require no authentication.
// These must be registered outside any auth middleware group.
func (h *Handler) RegisterAnonymousRoutes(r chi.Router) {
	r.Get("/api/v1/plugins/{id}/js", h.handlePluginJS)
	r.Get("/api/v1/metrics/query_range", h.handleMetricsQueryRange)
	// Internal HTTP SD endpoint — reachable by collectors inside the Docker network.
	r.Get("/api/v1/monitoring/targets", h.handleMonitoringTargets)
	// Dynamic Alloy River config — polled by alloy-collector inside the Docker network.
	r.Get("/api/v1/monitoring/alloy-config", h.handleAlloyConfig)
	r.Get("/api/v1/monitoring/alertmanager-config", h.handleAlertmanagerConfig)
}

// RegisterPublicRoutes attaches authenticated-but-not-admin plugin routes.
func (h *Handler) RegisterPublicRoutes(r chi.Router) {
	r.Get("/api/v1/plugins/catalog", h.handleMarketplaceCatalog)
	r.Get("/api/v1/plugins/installed", h.handleListInstalledPublic)
	r.Get("/api/v1/plugins/by-capability", h.handlePluginsByCapability)
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
			if p.Type == "ui" || p.FrontendURL != "" {
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
		FrontendURL: pluginJSProxyURL(p),
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

// pluginJSProxyURL returns the public proxy path for a plugin's JS bundle.
// If FrontendURL is an internal Docker URL (starts with "http://kleff-") the
// browser cannot reach it directly; the platform proxies it instead.
func pluginJSProxyURL(p *plugindomain.Plugin) string {
	if p.FrontendURL == "" {
		return ""
	}
	if strings.HasPrefix(p.FrontendURL, "http://kleff-") {
		return fmt.Sprintf("/api/v1/plugins/%s/js", p.ID)
	}
	return p.FrontendURL
}

// handlePluginJS proxies the plugin's JS bundle from its internal Docker-network
// URL to the browser. Only works for plugins whose FrontendURL starts with
// "http://kleff-" (i.e. is a container-internal address).
func (h *Handler) handlePluginJS(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	internalURL, err := h.manager.GetPluginInternalFrontendURL(r.Context(), id)
	if err != nil || internalURL == "" {
		http.NotFound(w, r)
		return
	}
	if !strings.HasPrefix(internalURL, "http://kleff-") {
		http.NotFound(w, r)
		return
	}

	resp, err := http.Get(internalURL) //nolint:noctx
	if err != nil {
		h.logger.Warn("plugin JS proxy: fetch failed", "id", id, "url", internalURL, "error", err)
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/javascript")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// handleMonitoringTargets returns a Prometheus HTTP SD-compatible JSON response
// listing all scrape targets from active monitoring.source plugins.
// Collectors (Alloy, vmagent, Prometheus) point their http_sd_configs here.
func (h *Handler) handleMonitoringTargets(w http.ResponseWriter, r *http.Request) {
	targets, err := h.manager.GetScrapeTargets(r.Context())
	if err != nil {
		h.logger.Error("monitoring targets", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	type sdTarget struct {
		Targets []string          `json:"targets"`
		Labels  map[string]string `json:"labels"`
	}

	out := make([]sdTarget, 0, len(targets))
	for _, t := range targets {
		labels := t.Labels
		if labels == nil {
			labels = map[string]string{}
		}
		if t.MetricsPath != "" && t.MetricsPath != "/metrics" {
			labels["__metrics_path__"] = t.MetricsPath
		}
		if t.Scheme != "" && t.Scheme != "http" {
			labels["__scheme__"] = t.Scheme
		}
		out = append(out, sdTarget{Targets: []string{t.Address}, Labels: labels})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

// handlePluginsByCapability returns active plugins that declare the requested capability.
// Collector plugins call this to discover backend addresses for remote_write.
func (h *Handler) handlePluginsByCapability(w http.ResponseWriter, r *http.Request) {
	capability := r.URL.Query().Get("capability")
	if capability == "" {
		commonhttp.Error(w, domain.NewBadRequest("capability query param required"))
		return
	}

	summaries, err := h.manager.GetActivePluginsByCapability(r.Context(), capability)
	if err != nil {
		h.logger.Error("plugins by capability", "capability", capability, "error", err)
		commonhttp.Error(w, domain.NewInternal(err))
		return
	}

	commonhttp.Success(w, map[string]any{"plugins": summaries})
}

// handleMetricsQueryRange proxies a PromQL query_range request to the active
// monitoring plugin's time-series backend (e.g. VictoriaMetrics).
func (h *Handler) handleMetricsQueryRange(w http.ResponseWriter, r *http.Request) {
	backendURL, err := h.manager.GetMetricsBackendURL(r.Context())
	if err != nil || backendURL == "" {
		commonhttp.Error(w, domain.NewBadRequest("no monitoring plugin installed"))
		return
	}

	target := backendURL + "/api/v1/query_range?" + r.URL.RawQuery
	resp, err := http.Get(target) //nolint:noctx
	if err != nil {
		h.logger.Warn("metrics proxy: upstream error", "url", target, "error", err)
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// handleAlertmanagerConfig generates a complete alertmanager.yml from all active plugins
// that declare an AlertmanagerReceiver block. The alertmanager-alerting plugin polls this
// endpoint and hot-reloads whenever the response changes.
func (h *Handler) handleAlertmanagerConfig(w http.ResponseWriter, r *http.Request) {
	receivers, err := h.manager.GetAlertmanagerReceivers(r.Context())
	if err != nil {
		h.logger.Error("alertmanager config: get receivers", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	var buf strings.Builder
	buf.WriteString("global:\n  resolve_timeout: 5m\n\n")
	buf.WriteString("route:\n")
	buf.WriteString("  receiver: default\n")
	buf.WriteString("  group_by: [alertname, severity]\n")
	buf.WriteString("  group_wait: 10s\n")
	buf.WriteString("  group_interval: 10s\n")
	buf.WriteString("  repeat_interval: 1h\n")
	if len(receivers) > 0 {
		buf.WriteString("  routes:\n")
		for _, rec := range receivers {
			buf.WriteString("    - receiver: " + rec.Name + "\n")
			buf.WriteString("      continue: true\n")
		}
	}
	buf.WriteString("\nreceivers:\n")
	buf.WriteString("  - name: default\n")
	for _, rec := range receivers {
		buf.WriteString("  - name: " + rec.Name + "\n")
		for cfgKey, cfgVal := range rec.Config {
			buf.WriteString("    " + cfgKey + ":\n")
			items, ok := cfgVal.([]interface{})
			if !ok {
				continue
			}
			for _, item := range items {
				itemMap, ok := item.(map[string]interface{})
				if !ok {
					continue
				}
				first := true
				for k, v := range itemMap {
					prefix := "      - "
					if !first {
						prefix = "        "
					}
					first = false
					buf.WriteString(prefix + k + ": " + yamlScalar(v) + "\n")
				}
			}
		}
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = io.WriteString(w, buf.String())
}

// yamlScalar serialises a value as a YAML scalar. All strings are wrapped in
// single quotes (YAML single-quoted scalar) so template syntax like {{ }} and
// leading * or # never break the parser. Literal single-quotes are doubled.
func yamlScalar(v interface{}) string {
	s, ok := v.(string)
	if !ok {
		return fmt.Sprintf("%v", v)
	}
	s = strings.ReplaceAll(s, "'", "''")
	return "'" + s + "'"
}

// handleAlloyConfig generates a complete Alloy River config from all active plugins
// that declare an Output block. The alloy-collector polls this endpoint and hot-reloads
// its config whenever the response changes — no Alloy restart needed when backends change.
func (h *Handler) handleAlloyConfig(w http.ResponseWriter, r *http.Request) {
	platformURL := r.URL.Query().Get("platform_url")

	outputs, err := h.manager.GetMonitoringOutputs(r.Context())
	if err != nil {
		h.logger.Error("alloy config: get outputs", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	var buf strings.Builder

	// HTTP SD discovery block — always present so Alloy can scrape targets.
	buf.WriteString("discovery.http \"kleff\" {\n")
	buf.WriteString("  url              = \"" + platformURL + "/api/v1/monitoring/targets\"\n")
	buf.WriteString("  refresh_interval = \"30s\"\n")
	buf.WriteString("}\n\n")

	var metricsReceivers []string
	var logsForwardTargets []string

	for _, out := range outputs {
		safeName := strings.NewReplacer("-", "_", ".", "_").Replace(out.PluginID)
		switch out.Protocol {
		case "remote_write":
			metricsReceivers = append(metricsReceivers, "prometheus.remote_write."+safeName+".receiver")
			buf.WriteString("prometheus.remote_write \"" + safeName + "\" {\n")
			buf.WriteString("  endpoint {\n")
			buf.WriteString("    url = \"" + out.URL + "\"\n")
			if out.BearerToken != "" {
				buf.WriteString("    bearer_token = \"" + out.BearerToken + "\"\n")
			}
			for k, v := range out.Headers {
				buf.WriteString("    headers = { \"" + k + "\" = \"" + v + "\" }\n")
			}
			buf.WriteString("  }\n}\n\n")
		case "otlp":
			metricsReceivers = append(metricsReceivers, "otelcol.exporter.prometheus."+safeName+".input")
			buf.WriteString("otelcol.exporter.otlphttp \"" + safeName + "\" {\n")
			buf.WriteString("  client {\n")
			buf.WriteString("    endpoint = \"" + out.URL + "\"\n")
			buf.WriteString("  }\n}\n\n")
		case "loki_push":
			logsForwardTargets = append(logsForwardTargets, "loki.write."+safeName+".receiver")
			buf.WriteString("loki.write \"" + safeName + "\" {\n")
			buf.WriteString("  endpoint {\n")
			buf.WriteString("    url = \"" + out.URL + "\"\n")
			buf.WriteString("  }\n}\n\n")
		}
	}

	if len(metricsReceivers) > 0 {
		buf.WriteString("prometheus.scrape \"kleff\" {\n")
		buf.WriteString("  targets    = discovery.http.kleff.targets\n")
		buf.WriteString("  forward_to = [" + strings.Join(metricsReceivers, ", ") + "]\n")
		buf.WriteString("}\n\n")
	}

	if len(logsForwardTargets) > 0 {
		buf.WriteString("discovery.docker \"containers\" {\n")
		buf.WriteString("  host = \"unix:///var/run/docker.sock\"\n")
		buf.WriteString("}\n\n")

		buf.WriteString("loki.relabel \"containers\" {\n")
		buf.WriteString("  forward_to = []\n\n")
		buf.WriteString("  rule {\n")
		buf.WriteString("    source_labels = [\"__meta_docker_container_name\"]\n")
		buf.WriteString("    regex         = \"/(.*)\"\n")
		buf.WriteString("    target_label  = \"container\"\n")
		buf.WriteString("  }\n\n")
		buf.WriteString("  rule {\n")
		buf.WriteString("    source_labels = [\"__meta_docker_container_label_kleff_io_plugin_id\"]\n")
		buf.WriteString("    target_label  = \"kleff_plugin_id\"\n")
		buf.WriteString("  }\n\n")
		buf.WriteString("  rule {\n")
		buf.WriteString("    source_labels = [\"__meta_docker_container_label_kleff_io_workload_id\"]\n")
		buf.WriteString("    target_label  = \"workload_id\"\n")
		buf.WriteString("  }\n}\n\n")

		buf.WriteString("loki.source.docker \"containers\" {\n")
		buf.WriteString("  host          = \"unix:///var/run/docker.sock\"\n")
		buf.WriteString("  targets       = discovery.docker.containers.targets\n")
		buf.WriteString("  forward_to    = [" + strings.Join(logsForwardTargets, ", ") + "]\n")
		buf.WriteString("  relabel_rules = loki.relabel.containers.rules\n")
		buf.WriteString("}\n")
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = io.WriteString(w, buf.String())
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
