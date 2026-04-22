import { get } from "./request";

export interface WorkloadMetricsDTO {
  workload_id: string;
  workload_name?: string;
  project_id: string;
  cpu_millicores: number;
  memory_mb: number;
  network_in_kbps: number;
  network_out_kbps: number;
  disk_read_kbps: number;
  disk_write_kbps: number;
  recorded_at: string;
  cpu_limit_millicores: number;
  memory_limit_bytes: number;
}

export function getProjectMetrics(projectID: string) {
  return get<{ workloads: WorkloadMetricsDTO[] }>(
    `/api/v1/usage/metrics?project_id=${encodeURIComponent(projectID)}`
  );
}
