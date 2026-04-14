import type { Metadata } from "next";
import { MarketplacePage } from "@/features/plugins/pages/MarketplacePage";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplaceRoute() {
  return <MarketplacePage />;
}
