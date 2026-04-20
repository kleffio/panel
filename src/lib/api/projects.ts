import { get, post, put, del } from "./request";

export interface ProjectDTO {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkloadDTO {
  id: string;
  name: string;
  organization_id: string;
  project_id: string;
  owner_id: string;
  blueprint_id: string;
  image: string;
  runtime_ref: string;
  endpoint: string;
  node_id: string;
  state: "pending" | "running" | "stopped" | "deleted" | "failed";
  error_message: string;
  cpu_millicores: number;
  memory_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectionDTO {
  id: string;
  project_id: string;
  source_workload_id: string;
  target_workload_id: string;
  kind: "network" | "dependency" | "traffic";
  label: string;
  created_at: string;
}

export interface GraphNodeDTO {
  id: string;
  project_id: string;
  workload_id: string;
  position_x: number;
  position_y: number;
  updated_at: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function listProjects(organizationID?: string) {
  const suffix = organizationID
    ? `?organization_id=${encodeURIComponent(organizationID)}`
    : "";
  return get<{ projects: ProjectDTO[] }>(`/api/v1/projects${suffix}`);
}

export function createProject(payload: {
  organization_id?: string;
  name: string;
  slug?: string;
}) {
  return post<ProjectDTO, typeof payload>("/api/v1/projects", payload);
}

export function getProject(projectID: string) {
  return get<ProjectDTO>(`/api/v1/projects/${projectID}`);
}

// ── Workloads ─────────────────────────────────────────────────────────────────

export function listWorkloads(projectID: string) {
  return get<{ workloads: WorkloadDTO[] }>(
    `/api/v1/projects/${projectID}/workloads`
  );
}

export function provisionWorkload(
  projectID: string,
  payload: {
    owner_id?: string;
    blueprint_id?: string;
    image: string;
    env_overrides?: Record<string, string>;
    memory_bytes?: number;
    cpu_millicores?: number;
  }
) {
  return post<{ workload_id: string; deployment_id: string }, typeof payload>(
    `/api/v1/projects/${projectID}/workloads`,
    payload
  );
}

export function deleteWorkload(projectID: string, workloadID: string) {
  return del<void>(
    `/api/v1/projects/${projectID}/workloads/${encodeURIComponent(workloadID)}`
  );
}

// ── Connections ───────────────────────────────────────────────────────────────

export function listConnections(projectID: string) {
  return get<{ connections: ConnectionDTO[] }>(
    `/api/v1/projects/${projectID}/connections`
  );
}

export function createConnection(
  projectID: string,
  payload: {
    source_workload_id: string;
    target_workload_id: string;
    kind: "network" | "dependency" | "traffic";
    label?: string;
  }
) {
  return post<ConnectionDTO, typeof payload>(
    `/api/v1/projects/${projectID}/connections`,
    payload
  );
}

export function deleteConnection(projectID: string, connectionID: string) {
  return del<void>(
    `/api/v1/projects/${projectID}/connections/${encodeURIComponent(connectionID)}`
  );
}

// ── Graph node positions ──────────────────────────────────────────────────────

export function listGraphNodes(projectID: string) {
  return get<{ graph_nodes: GraphNodeDTO[] }>(
    `/api/v1/projects/${projectID}/graph-nodes`
  );
}

export function upsertGraphNode(
  projectID: string,
  workloadID: string,
  position: { position_x: number; position_y: number }
) {
  return put<GraphNodeDTO, typeof position>(
    `/api/v1/projects/${projectID}/graph-nodes/${encodeURIComponent(workloadID)}`,
    position
  );
}
