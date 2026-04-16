import { get, post, del } from "./request";

export interface ResourceOverride {
  memory_mb: number;
  cpu_millicores: number;
}

export interface CreateDeploymentPayload {
  blueprint_id: string;
  server_name: string;
  config: Record<string, string>;
  resources?: ResourceOverride;
}

export interface Deployment {
  id: string;
  server_name: string;
  status: "pending" | "in_progress" | "restarting" | "succeeded" | "failed" | "rolled_back";
  address: string;
  created_at: string;
}

interface WorkloadDTO {
  id: string;
  name: string;
  endpoint: string;
  state: "pending" | "running" | "stopped" | "deleted" | "failed";
  created_at: string;
}

function toDeploymentStatus(state: WorkloadDTO["state"]): Deployment["status"] {
  switch (state) {
    case "running":
      return "succeeded";
    case "stopped":
      return "rolled_back";
    case "failed":
      return "failed";
    case "deleted":
      return "rolled_back";
    default:
      return "pending";
  }
}

export function createDeployment(projectID: string, payload: CreateDeploymentPayload) {
  return post<{ deployment_id: string }, CreateDeploymentPayload>(
    `/api/v1/projects/${projectID}/workloads`,
    payload
  );
}

export async function listDeployments(projectID: string) {
  if (!projectID) {
    return [];
  }
  const response = await get<{ workloads: WorkloadDTO[] }>(
    `/api/v1/projects/${projectID}/workloads`
  );
  return (response.workloads ?? [])
    .filter((workload) => workload.state !== "deleted")
    .map((workload) => ({
      id: workload.id,
      server_name: workload.name || workload.id,
      status: toDeploymentStatus(workload.state),
      address: workload.endpoint,
      created_at: workload.created_at,
    }));
}

export function deleteDeployment(projectID: string, id: string) {
  return del<void>(`/api/v1/projects/${projectID}/workloads/${id}`);
}

export function stopServer(projectID: string, id: string) {
  return post<void, undefined>(`/api/v1/projects/${projectID}/workloads/${id}/stop`, undefined);
}

export function startServer(projectID: string, id: string) {
  return post<void, undefined>(`/api/v1/projects/${projectID}/workloads/${id}/start`, undefined);
}

export function restartServer(projectID: string, id: string) {
  return post<void, undefined>(`/api/v1/projects/${projectID}/workloads/${id}/restart`, undefined);
}
