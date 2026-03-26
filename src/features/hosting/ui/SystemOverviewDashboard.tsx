import { Activity, AlertTriangle, CheckCircle2, GitCommit, HardDrive, Cpu, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import type {
  AiSuggestion,
  InfrastructureNode,
  OverviewActivityItem,
  OverviewDeploymentItem,
  OverviewMetricCard,
} from "@/features/hosting/model/types";

export function SystemOverviewDashboard({
  infrastructureNodes,
  mockAiSuggestions,
  overviewMetricCards,
  overviewDeployments,
  overviewActivityFeed,
}: {
  infrastructureNodes: InfrastructureNode[];
  mockAiSuggestions: AiSuggestion[];
  overviewMetricCards: OverviewMetricCard[];
  overviewDeployments: OverviewDeploymentItem[];
  overviewActivityFeed: OverviewActivityItem[];
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
        <p className="text-sm text-[var(--test-muted)] mt-1">Detailed metrics and health of the global infrastructure.</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetricCards.map((metric) => (
          <div key={metric.label} className="rounded-[1.25rem] border border-[var(--test-border)] bg-[var(--test-panel-soft)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--test-muted)]">{metric.label}</p>
              {metric.icon === "activity" && <Activity className="h-4 w-4 text-[var(--test-foreground)]" />}
              {metric.icon === "hard-drive" && <HardDrive className="h-4 w-4 text-[var(--test-foreground)]" />}
              {metric.icon === "cpu" && <Cpu className="h-4 w-4 text-[var(--test-foreground)]" />}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{metric.value}</span>
              {metric.suffix ? (
                <span className="text-sm font-medium text-[var(--test-muted)]">{metric.suffix}</span>
              ) : null}
            </div>
            <p className={`mt-1 flex items-center gap-1 text-xs ${metric.tone === "success" ? "text-emerald-500" : metric.tone === "danger" ? "text-rose-500" : "text-[var(--test-muted)]"}`}>
              {metric.trendDirection ? <TrendingUp className="h-3 w-3" /> : null}
              {metric.caption}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Smart AI Alerts */}
          <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] overflow-hidden">
            <div className="border-b border-[var(--test-border)] bg-[var(--test-panel-soft)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Active Alerts & AI Insights
              </h2>
              <span className="bg-rose-500/10 text-rose-500 text-xs py-1 px-2.5 rounded-full font-medium">{mockAiSuggestions.length} items</span>
            </div>
            <div className="divide-y divide-[var(--test-border)]">
              {mockAiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-6 transition hover:bg-[var(--test-panel-muted)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${suggestion.severity === 'critical' ? 'bg-rose-500' : suggestion.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <h3 className="text-sm font-medium">{suggestion.title}</h3>
                      </div>
                      <p className="text-sm text-[var(--test-muted)] leading-relaxed pl-4">{suggestion.description}</p>
                    </div>
                    <button className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--test-border)] hover:bg-[var(--test-accent-soft)] transition">
                      {suggestion.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Resources */}
          <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] overflow-hidden">
            <div className="border-b border-[var(--test-border)] px-6 py-4">
              <h2 className="text-sm font-semibold">Resource Usage Across Nodes</h2>
            </div>
            <div className="p-2">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--test-muted)] bg-[var(--test-panel-soft)]">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">Node</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">CPU</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg">Memory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--test-border)]/50">
                  {infrastructureNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-[var(--test-panel-muted)] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {node.icon ? <node.icon className="h-4 w-4 text-[var(--test-muted)]" /> : null}
                          <span className="font-medium text-[var(--test-foreground)]">{node.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--test-muted)]">
                          {node.status === 'running' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {node.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                          {node.status === 'starting' && <Activity className="h-3.5 w-3.5 text-amber-500" />}
                          <span className="capitalize">{node.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[var(--test-border)] rounded-full overflow-hidden">
                            <div className={`h-full ${node.metrics?.cpu && node.metrics.cpu > 80 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${node.metrics?.cpu || 0}%` }}></div>
                          </div>
                          <span className="text-xs">{node.metrics?.cpu || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--test-muted)]">
                        {node.metrics?.ramLabel || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Deployments */}
          <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] overflow-hidden">
             <div className="border-b border-[var(--test-border)] px-6 py-4">
              <h2 className="text-sm font-semibold">Recent Deployments</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Deploy Item */}
              {overviewDeployments.map((deployment) => (
              <div key={deployment.title} className="flex gap-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${deployment.active ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-[var(--test-border)]"}`} />
                <div>
                  <p className="text-sm font-medium">{deployment.title}</p>
                  <p className="text-xs text-[var(--test-muted)] mt-0.5">{deployment.description}</p>
                </div>
              </div>
              ))}
            </div>
            <div className="border-t border-[var(--test-border)] p-3">
              <button className="w-full py-2 text-xs font-medium text-[var(--test-muted)] hover:text-[var(--test-foreground)] transition flex items-center justify-center gap-1">
                View all deployments <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] overflow-hidden">
            <div className="border-b border-[var(--test-border)] px-6 py-4">
              <h2 className="text-sm font-semibold">Activity Feed</h2>
            </div>
            <div className="p-4 space-y-4">
              {overviewActivityFeed.map((item) => (
                <div key={`${item.message}-${item.time}`} className="flex gap-3 items-start">
                  {item.icon === "commit" && <GitCommit className="w-4 h-4 text-[var(--test-muted)] mt-0.5" />}
                  {item.icon === "alert" && <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />}
                  {item.icon === "check" && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />}
                  <div className="text-sm">
                    <p className="text-[var(--test-foreground)]">{item.message}</p>
                    <p className="text-xs text-[var(--test-muted)]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
