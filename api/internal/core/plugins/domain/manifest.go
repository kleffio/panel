package domain

// CatalogManifest is a plugin's entry in the remote plugin registry.
// Shape mirrors the plugin.json manifest documented in PLUGIN_SPEC.md.
type CatalogManifest struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Type            string          `json:"type"`
	// Tier is the plugin execution tier: 0 = static (no container), 1 = stateless,
	// 2 = stateful. If omitted, the platform infers tier from capabilities.
	Tier            int             `json:"tier,omitempty"`
	Description     string          `json:"description"`
	LongDescription string          `json:"longDescription,omitempty"`
	Tags            []string        `json:"tags,omitempty"`
	Capabilities    []string        `json:"capabilities,omitempty"`
	Author          string          `json:"author"`
	Repo            string          `json:"repo"`
	Docs            string          `json:"docs,omitempty"`
	Image           string          `json:"image"`
	Version         string          `json:"version"`
	FrontendURL     string          `json:"frontendUrl,omitempty"`
	MinKleffVersion string          `json:"minKleffVersion,omitempty"`
	License         string          `json:"license,omitempty"`
	Verified        bool            `json:"verified"`
	Logo            string          `json:"logo,omitempty"`
	Screenshots     []string        `json:"screenshots,omitempty"`
	Config          []ConfigField    `json:"config,omitempty"`
	Volumes         []CompanionVolume `json:"volumes,omitempty"`
	Companions      []CompanionSpec  `json:"companions,omitempty"`
	// Dependencies lists plugin IDs that must be installed and enabled before
	// this plugin can be installed. Example: ["billing-framework"].
	Dependencies []string `json:"dependencies,omitempty"`

	// Scrape describes the Prometheus-compatible scrape endpoint for monitoring.source
	// plugins. When set, the platform includes this plugin in the HTTP SD response
	// without needing any gRPC implementation.
	Scrape *ScrapeConfig `json:"scrape,omitempty"`

	// Output declares the telemetry write endpoint this plugin exposes to collector plugins.
	// Collector plugins (e.g. Alloy) query the platform for active outputs and generate
	// their forwarding config dynamically — no collector changes needed when backends are added.
	Output *PluginOutput `json:"output,omitempty"`

	// Query declares the normalized read endpoint this plugin exposes for the platform to
	// proxy log/metric queries to. Replaces any backend-specific adapter in the platform.
	Query *PluginQuery `json:"query,omitempty"`

	// AlertmanagerReceiver declares an Alertmanager receiver block this notification plugin
	// provides. String values in Config may contain ${ENV_VAR} placeholders; the platform
	// substitutes the plugin's actual config/secret values before generating alertmanager.yml.
	AlertmanagerReceiver *AlertmanagerReceiver `json:"alertmanagerReceiver,omitempty"`

	// Ports exposes container ports on the host for tier 1 plugins (e.g. Grafana :3000,
	// Alertmanager :9093). Tier 2 plugins use the built-in gRPC port; tier 0 has no container.
	Ports []CompanionPort `json:"ports,omitempty"`

	// Privileged grants the plugin container extended host privileges.
	// Required for plugins that need deep host access (e.g. cAdvisor reading cgroups).
	Privileged bool `json:"privileged,omitempty"`

	// Command overrides the container's default CMD (optional).
	// Example: ["--path.rootfs=/host"] for node-exporter.
	Command []string `json:"command,omitempty"`
}

// PluginQuery declares the normalized log/metric query endpoint a backend plugin exposes.
// The platform proxies read requests to this URL with standard query params and expects
// a standard JSON response — no backend-specific knowledge in the platform.
type PluginQuery struct {
	// URL is the full base URL of the plugin's own HTTP query server.
	// Example: "http://kleff-loki-plugin:8080"
	URL string `json:"url"`
	// Path is the query endpoint path appended to URL.
	// Example: "/logs" — called as GET <URL><Path>?workload_id=<id>&limit=<n>
	Path string `json:"path"`
}

// PluginOutput declares the telemetry write endpoint a backend plugin exposes.
// Collector plugins query /api/v1/monitoring/alloy-config to get the full
// generated River config for all active outputs — no collector manifest changes needed.
type PluginOutput struct {
	// Protocol identifies the write protocol: "remote_write", "loki_push", or "otlp".
	Protocol string `json:"protocol"`
	// Path is the URL path appended to the companion's internalAddr to form the full write URL.
	// Example: "/api/v1/write" for VictoriaMetrics, "/loki/api/v1/push" for Loki.
	// May contain ${ENV_VAR} placeholders substituted from the plugin's config/secrets.
	Path string `json:"path"`
	// BearerToken is an optional bearer token for authenticating write requests.
	// May contain ${ENV_VAR} placeholders.
	BearerToken string `json:"bearerToken,omitempty"`
	// Headers is an optional map of extra HTTP headers to include in write requests.
	// Values may contain ${ENV_VAR} placeholders.
	Headers map[string]string `json:"headers,omitempty"`
}

// ScrapeConfig describes a static Prometheus scrape endpoint for a source plugin.
type ScrapeConfig struct {
	// Port is the port the exporter listens on, e.g. 9100 for node-exporter.
	Port int `json:"port"`
	// Path is the metrics HTTP path; defaults to "/metrics".
	Path string `json:"path,omitempty"`
	// Scheme is "http" or "https"; defaults to "http".
	Scheme string `json:"scheme,omitempty"`
}

// AlertmanagerReceiver declares the Alertmanager receiver configuration a notification
// plugin provides. Config mirrors Alertmanager's receiver YAML structure as a nested
// map. String values may contain ${ENV_VAR} placeholders which the platform substitutes
// with the plugin's actual config/secret values before generating alertmanager.yml.
type AlertmanagerReceiver struct {
	Name   string                 `json:"name"`
	Config map[string]interface{} `json:"config"`
}

// AlertmanagerReceiverInstance is a resolved AlertmanagerReceiver with all ${ENV_VAR}
// placeholders substituted with the plugin's actual config/secret values.
type AlertmanagerReceiverInstance struct {
	Name   string
	Config map[string]interface{}
}

// MonitoringOutput describes one active telemetry write endpoint, combining
// the plugin's declared output protocol with the resolved companion address.
type MonitoringOutput struct {
	// PluginID is the plugin that exposes this output.
	PluginID string
	// Protocol identifies the write protocol: "remote_write", "loki_push", or "otlp".
	Protocol string
	// URL is the full write endpoint: companion internalAddr + output path (env vars substituted).
	URL string
	// BearerToken is an optional resolved bearer token for authenticating write requests.
	BearerToken string
	// Headers is an optional map of resolved extra HTTP headers for write requests.
	Headers map[string]string
}

// PluginSummary is a lightweight view of an installed plugin used by capability
// discovery queries (e.g. collector plugins finding their backends).
type PluginSummary struct {
	ID           string
	Capability   string
	InternalAddr string // gRPC addr of the plugin container
	ScrapeURL    string // companion internalAddr, if any (e.g. VictoriaMetrics HTTP)
	QueryURL     string // full URL of the plugin's normalized query endpoint, if any
}

// CompanionSpec declares a dependency container that the platform spins up
// alongside the plugin container. The companion shares the plugin's network
// and is managed (deploy/remove) together with the plugin.
type CompanionSpec struct {
	// ID is the container name on the kleff network, e.g. "keycloak".
	// Must be unique across all installed plugins.
	ID string `json:"id"`

	// Image is the Docker image reference for the companion container.
	Image string `json:"image"`

	// Entrypoint overrides the container's default ENTRYPOINT.
	Entrypoint []string `json:"entrypoint,omitempty"`

	// Command overrides the container's default CMD, e.g. ["start-dev"].
	Command []string `json:"command,omitempty"`

	// Env is a set of static environment variables injected into the companion.
	Env map[string]string `json:"env,omitempty"`

	// Ports exposes companion container ports on the host.
	Ports []CompanionPort `json:"ports,omitempty"`

	// Volumes declares named volumes mounted into the companion for persistence.
	Volumes []CompanionVolume `json:"volumes,omitempty"`

	// SkipIfEnv names a plugin config key: if the user supplied a non-empty
	// value for that key, the companion is not deployed (the user is providing
	// their own external service instead).
	SkipIfEnv string `json:"skipIfEnv,omitempty"`

	// InternalAddr is the address the plugin should use to reach this companion
	// when it is deployed (i.e. when SkipIfEnv is unset). The platform injects
	// this value as the SkipIfEnv env var so the plugin always has a valid URL.
	// Example: "http://keycloak:8080"
	InternalAddr string `json:"internalAddr,omitempty"`

	// WaitForTCP, if set, is a "host:port" address the platform will poll with
	// TCP dial attempts before deploying this companion. Use this to ensure a
	// dependency companion (e.g. a database) is fully accepting connections
	// before the dependent service starts.
	// Example: "zitadel-postgres:5432"
	WaitForTCP string `json:"waitForTCP,omitempty"`

	// User overrides the container's default user (UID or "name" or "name:group").
	// Leave empty to use the image default. Set to "root" when the companion
	// needs to write to a Docker volume that is owned by root (e.g. ZITADEL
	// writing /machinekey/pat.token on first-instance init).
	User string `json:"user,omitempty"`
}

// CompanionPort maps a container port to an optional fixed host port.
type CompanionPort struct {
	ContainerPort int    `json:"container"`
	HostPort      int    `json:"host,omitempty"` // 0 = auto-assign
	Protocol      string `json:"protocol,omitempty"` // default: "tcp"
}

// CompanionVolume maps a named Docker volume or host path to a path inside the container.
type CompanionVolume struct {
	Name     string `json:"name"`             // Docker volume name, e.g. "kleff-keycloak-data". Empty when HostPath is set.
	Target   string `json:"target"`           // Mount path inside container, e.g. "/opt/keycloak/data"
	HostPath string `json:"hostPath,omitempty"` // If set, bind-mount this host path instead of a named volume
	ReadOnly bool   `json:"readOnly,omitempty"` // Mount as read-only
}

// ConfigField describes one configuration value the plugin expects.
// These are rendered as form fields in the Install/Configure modal and
// injected as environment variables into the plugin container.
type ConfigField struct {
	// Key is the environment variable name injected into the container.
	Key string `json:"key"`

	// Label is the human-readable form field label.
	Label string `json:"label"`

	// Description is shown below the input field.
	Description string `json:"description,omitempty"`

	// Type is one of: string, secret, number, boolean, select, url.
	Type string `json:"type"`

	// Required indicates the admin must fill this in before installing.
	Required bool `json:"required"`

	// Default is the pre-filled default value (optional).
	Default string `json:"default,omitempty"`

	// Options is the list of choices for type "select".
	Options []string `json:"options,omitempty"`

	// Advanced indicates if the field should be tucked away in advanced settings
	Advanced bool `json:"advanced,omitempty"`

	// ResolveFromCapability, if set, causes the platform to automatically populate
	// this field at install time with the ScrapeURL of the first active plugin with
	// the given capability (e.g. "monitoring.metrics"). An admin-provided value
	// always takes precedence. Fields with this set are not required from the admin.
	ResolveFromCapability string `json:"resolveFromCapability,omitempty"`
}
