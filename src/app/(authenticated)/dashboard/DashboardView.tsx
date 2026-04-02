"use client";

import { Activity, Server, Users, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MetricCard } from "@/components/domain/MetricCard";
import { ServerCard } from "@/components/domain/ServerCard";
import { PluginSlot } from "@/components/plugin/PluginSlot";
import { Card, CardContent, CardHeader, CardTitle } from "@kleffio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kleffio/ui";
import type { GameServer } from "@/types";

// ─── Mock data — replace with useQuery hooks when the API is wired up ─────────

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

const deploymentChartData = [
  { day: "Mon", deployments: 4 },
  { day: "Tue", deployments: 7 },
  { day: "Wed", deployments: 3 },
  { day: "Thu", deployments: 9 },
  { day: "Fri", deployments: 6 },
  { day: "Sat", deployments: 2 },
  { day: "Sun", deployments: 1 },
];

const runningServers = MOCK_SERVERS.filter((s) => s.status === "running");
const totalPlayers = MOCK_SERVERS.reduce((n, s) => n + s.currentPlayers, 0);
const crashedCount = MOCK_SERVERS.filter((s) => s.status === "crashed").length;

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Your infrastructure at a glance.</p>
      </div>

      {/* Metrics */}
      <PluginSlot name="dashboard.metrics" slotProps={{ servers: MOCK_SERVERS, runningServers, totalPlayers, crashedCount }}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Active Servers"
            value={runningServers.length}
            icon={<Server className="size-4" />}
            delta={{ value: "2 this week", direction: "up" }}
          />
          <MetricCard
            label="Live Players"
            value={totalPlayers}
            icon={<Users className="size-4" />}
            delta={{ value: "+12%", direction: "up" }}
          />
          <MetricCard
            label="Deployments Today"
            value={9}
            icon={<Activity className="size-4" />}
            delta={{ value: "same as yesterday", direction: "neutral" }}
          />
          <MetricCard
            label="Incidents"
            value={crashedCount}
            icon={<AlertTriangle className="size-4" />}
            delta={{ value: "1 new", direction: "down" }}
          />
        </div>
      </PluginSlot>

      {/* Plugin top */}
      <PluginSlot name="dashboard.top" />

      {/* Plugin widgets */}
      <PluginSlot name="dashboard.widget" />

      {/* Plugin bottom */}
      <PluginSlot name="dashboard.bottom" />

      {/* Main content */}
      <Tabs defaultValue="servers">
        <TabsList>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="mt-4">
          <PluginSlot name="dashboard.servers-tab" slotProps={{ servers: MOCK_SERVERS }}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MOCK_SERVERS.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          </PluginSlot>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <PluginSlot name="dashboard.activity-tab" slotProps={{ deploymentChartData }}>
            <Card>
              <CardHeader>
                <CardTitle>Deployments — last 7 days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deploymentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="deployments" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </PluginSlot>
        </TabsContent>
      </Tabs>
    </div>
  );
}
