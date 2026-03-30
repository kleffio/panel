"use client";

import { Plus } from "lucide-react";
import { ServerCard } from "@/components/domain/ServerCard";
import { Button } from "@kleffio/ui";
import { Input } from "@kleffio/ui";
import type { GameServer } from "@/types";

// TODO: replace with useQuery + pagination
const MOCK_SERVERS: GameServer[] = [
  {
    id: "srv-001",
    organizationId: "org-001",
    name: "mc-survival-na",
    gameType: "Minecraft",
    region: "us-east-1",
    status: "running",
    plan: { id: "plan-pro", tier: "pro", name: "Pro", vcpu: 4, memoryGb: 8, storageGb: 100, bandwidthGb: 2000, maxPlayers: 50, pricePerHour: 0.12 },
    resources: { cpuPercent: 42, memoryPercent: 67, diskPercent: 23, networkInMbps: 12, networkOutMbps: 8 },
    ipAddress: "34.201.12.88",
    port: 25565,
    currentPlayers: 18,
    createdAt: "2024-11-01T00:00:00Z",
    updatedAt: "2025-03-18T10:00:00Z",
    lastStartedAt: "2025-03-18T08:00:00Z",
  },
  {
    id: "srv-002",
    organizationId: "org-001",
    name: "valheim-eu-pvp",
    gameType: "Valheim",
    region: "eu-central-1",
    status: "running",
    plan: { id: "plan-business", tier: "business", name: "Business", vcpu: 8, memoryGb: 16, storageGb: 250, bandwidthGb: 5000, maxPlayers: 100, pricePerHour: 0.28 },
    resources: { cpuPercent: 71, memoryPercent: 55, diskPercent: 40, networkInMbps: 45, networkOutMbps: 22 },
    ipAddress: "18.185.44.9",
    port: 2456,
    currentPlayers: 63,
    createdAt: "2024-12-15T00:00:00Z",
    updatedAt: "2025-03-18T10:00:00Z",
    lastStartedAt: "2025-03-17T20:00:00Z",
  },
  {
    id: "srv-003",
    organizationId: "org-001",
    name: "csgo-casual-ap",
    gameType: "CS2",
    region: "ap-southeast-1",
    status: "stopped",
    plan: { id: "plan-starter", tier: "starter", name: "Starter", vcpu: 2, memoryGb: 4, storageGb: 50, bandwidthGb: 500, maxPlayers: 20, pricePerHour: 0.05 },
    currentPlayers: 0,
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-03-17T22:00:00Z",
  },
  {
    id: "srv-004",
    organizationId: "org-001",
    name: "rust-official-eu",
    gameType: "Rust",
    region: "eu-west-1",
    status: "crashed",
    plan: { id: "plan-business", tier: "business", name: "Business", vcpu: 8, memoryGb: 16, storageGb: 250, bandwidthGb: 5000, maxPlayers: 100, pricePerHour: 0.28 },
    resources: { cpuPercent: 0, memoryPercent: 0, diskPercent: 61, networkInMbps: 0, networkOutMbps: 0 },
    currentPlayers: 0,
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-03-18T07:12:00Z",
    lastStartedAt: "2025-03-18T06:00:00Z",
  },
];

export function ServersView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Game Servers</h1>
          <p className="text-sm text-muted-foreground">
            {MOCK_SERVERS.length} server{MOCK_SERVERS.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4" />
          New Server
        </Button>
      </div>

      <Input
        placeholder="Search servers…"
        className="max-w-sm"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MOCK_SERVERS.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    </div>
  );
}
