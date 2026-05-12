"use client";

import { LogViewer } from "@/features/hosting/ui/LogViewer";
import { useServerContext } from "../_hooks/useServerContext";

export default function ServerLogsPage() {
  const { projectID, workloadID } = useServerContext();
  if (!projectID) return null;
  return <LogViewer projectID={projectID} workloadId={workloadID} />;
}
