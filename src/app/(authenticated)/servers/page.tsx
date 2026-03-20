import type { Metadata } from "next";
import { ServersView } from "./ServersView";

export const metadata: Metadata = { title: "Servers" };

export default function ServersPage() {
  return <ServersView />;
}
