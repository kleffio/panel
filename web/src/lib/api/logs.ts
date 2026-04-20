import { get } from "./request";

export interface LogLineDTO {
  id: number;
  workload_id: string;
  project_id: string;
  ts: string;
  stream: "stdout" | "stderr";
  line: string;
}

export function getWorkloadLogs(projectID: string, workloadID: string, limit = 200) {
  return get<{ lines: LogLineDTO[] }>(
    `/api/v1/projects/${encodeURIComponent(projectID)}/workloads/${encodeURIComponent(workloadID)}/logs?limit=${limit}`
  );
}
