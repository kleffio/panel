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

export function createDeployment(payload: CreateDeploymentPayload) {
  return post<{ deployment_id: string }, CreateDeploymentPayload>(
    "/api/v1/deployments",
    payload
  );
}

export function listDeployments() {
  return get<Deployment[]>("/api/v1/deployments");
}

export function deleteDeployment(id: string) {
  return del<void>(`/api/v1/deployments/${id}`);
}

export function stopServer(id: string) {
  return post<void, undefined>(`/api/v1/deployments/${id}/stop`, undefined);
}

export function startServer(id: string) {
  return post<void, undefined>(`/api/v1/deployments/${id}/start`, undefined);
}

export function restartServer(id: string) {
  return post<void, undefined>(`/api/v1/deployments/${id}/restart`, undefined);
}
