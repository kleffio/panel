import type { Metadata } from "next";
import { getHostingArchitecturePageData } from "@/features/hosting/server/loaders";
import { ArchitectureView } from "@/features/hosting/pages/ArchitectureView";

export const metadata: Metadata = { title: "Architecture" };

export default async function ArchitecturePage() {
  const data = await getHostingArchitecturePageData();

  return (
    <ArchitectureView
      infrastructureNodes={data.infrastructureNodes}
      infrastructureEdges={data.infrastructureEdges}
      mockAiSuggestions={data.mockAiSuggestions}
    />
  );
}
