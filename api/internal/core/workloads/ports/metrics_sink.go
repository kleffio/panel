package ports

import "context"

// MetricsSink receives workload metric samples and forwards them to the active
// observability framework plugin (if any).
type MetricsSink interface {
	IngestWorkloadMetrics(ctx context.Context, sample *MetricSample) error
}

// MetricSample is the workload-layer view of a single resource observation.
type MetricSample struct {
	WorkloadID    string
	NodeID        string
	OrgID         string
	ProjectID     string
	Timestamp     int64
	CPUMillicores int64
	MemoryMB      int64
	NetworkRxMB   float64
	NetworkTxMB   float64
	DiskReadMB    float64
	DiskWriteMB   float64
}
