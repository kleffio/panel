import type { LucideIcon } from "lucide-react";

export type HostingPageKey =
  | "web"
  | "server"
  | "database"
  | "cache"
  | "proxy"
  | "workers"
  | "game-server"
  | "observability";
export type NodeStatus = "running" | "starting" | "error";
export type NodeKind = "app" | "api" | "worker" | "database" | "cache" | "proxy" | "game-server" | "support";
export type EdgeKind = "network" | "dependency" | "traffic";
export type NodeAction = "restart" | "logs" | "scale";

export type NodeMetricsPreview = {
  cpu: number;
  ram: number;
  ramLabel: string;
  traffic: string;
};

export type NodePanelData = {
  title: string;
  description: string;
  highlights: string[];
};

export type AiSuggestion = {
  id: string;
  nodeId: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  actionLabel: string;
};

export type DetailRow = {
  primary: string;
  secondary: string;
  meta?: string;
};

export type DetailPanelData = {
  title: string;
  badge: string;
  rows: DetailRow[];
};

export type DetailSection = {
  key: HostingPageKey;
  label: string;
  title: string;
  description: string;
  badges: string[];
  stats: Array<{ label: string; value: string }>;
  leftPanel: DetailPanelData;
  rightPanel: DetailPanelData;
  attachedTitle: string;
  attachedBadge: string;
  attached: Array<{ name: string; description: string; status: string; href?: string }>;
};

export type OverviewMetricCard = {
  label: string;
  value: string;
  suffix?: string;
  caption: string;
  trendDirection?: "up";
  tone?: "default" | "success" | "danger";
  icon: "activity" | "hard-drive" | "cpu";
};

export type OverviewDeploymentItem = {
  title: string;
  description: string;
  active: boolean;
};

export type OverviewActivityItem = {
  message: string;
  time: string;
  icon: "commit" | "alert" | "check";
};

export type GameServerResourceCard = {
  label: string;
  value: string;
  detail: string;
};

export type GameServerConsoleLine = {
  time: string;
  tag: string;
  tone: string;
  message: string;
};

export type GameServerExplorerGroup = {
  title: string;
  items: string[];
};

export type GameServerContainer = {
  name: string;
  description: string;
  status: string;
  meta: string[];
};

export type GameServerAttachedDatabase = {
  name: string;
  description: string;
  status: string;
  badges: string[];
  href: string;
};

export type GameServerDetailData = {
  badges: string[];
  title: string;
  description: string;
  resourceCards: GameServerResourceCard[];
  consoleLines: GameServerConsoleLine[];
  explorerGroups: GameServerExplorerGroup[];
  selectedFile: {
    path: string;
    overview: string;
    recentChange: string;
  };
  containers: GameServerContainer[];
  attachedDatabasesDescription: string;
  attachedDatabasesBadge: string;
  attachedDatabases: GameServerAttachedDatabase[];
  footerNote: string;
};

export type FlowNode = {
  key: HostingPageKey;
  name: string;
  subtext: string;
  status: string;
  footer?: string;
  icon: LucideIcon;
  variant?: "default" | "warning";
  route: string;
};

export type InfrastructureNode = {
  id: string;
  key?: HostingPageKey;
  name: string;
  subtitle: string;
  description: string;
  kind: NodeKind;
  status: NodeStatus;
  icon?: LucideIcon;
  route?: string;
  badges: string[];
  metrics: NodeMetricsPreview;
  footer?: string;
  position: {
    x: number;
    y: number;
  };
  actions: NodeAction[];
  panel: NodePanelData;
};

export type InfrastructureEdge = {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label: string;
  sourceHandle?: string;
  targetHandle?: string;
};
