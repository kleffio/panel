package application

import (
	"context"

	pluginsv1 "github.com/kleffio/plugin-sdk-go/v1"
	workloadports "github.com/kleffio/platform/internal/core/workloads/ports"
)

// MetricsSinkAdapter bridges workloadports.MetricsSink to Manager.IngestWorkloadMetrics.
type MetricsSinkAdapter struct {
	mgr *Manager
}

func NewMetricsSinkAdapter(mgr *Manager) *MetricsSinkAdapter {
	return &MetricsSinkAdapter{mgr: mgr}
}

func (a *MetricsSinkAdapter) IngestWorkloadMetrics(ctx context.Context, s *workloadports.MetricSample) error {
	return a.mgr.IngestWorkloadMetrics(ctx, &pluginsv1.MetricSample{
		WorkloadID:    s.WorkloadID,
		NodeID:        s.NodeID,
		OrgID:         s.OrgID,
		ProjectID:     s.ProjectID,
		Timestamp:     s.Timestamp,
		CPUMillicores: s.CPUMillicores,
		MemoryMB:      s.MemoryMB,
		NetworkRxMB:   s.NetworkRxMB,
		NetworkTxMB:   s.NetworkTxMB,
		DiskReadMB:    s.DiskReadMB,
		DiskWriteMB:   s.DiskWriteMB,
	})
}
