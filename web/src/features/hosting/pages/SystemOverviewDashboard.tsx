import { Activity, AlertTriangle, CheckCircle2, GitCommit, HardDrive, Cpu, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import type {
  InfrastructureNode,
  OverviewActivityItem,
  OverviewDeploymentItem,
  OverviewMetricCard,
} from "@/features/hosting/model/types";

export function SystemOverviewDashboard({
  infrastructureNodes,
  overviewMetricCards,
  overviewDeployments,
  overviewActivityFeed,
}: {
  infrastructureNodes: InfrastructureNode[];
  overviewMetricCards: OverviewMetricCard[];
  overviewDeployments: OverviewDeploymentItem[];
  overviewActivityFeed: OverviewActivityItem[];
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Detailed metrics and health of the global infrastructure.</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetricCards.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">{metric.label}</p>
              {metric.icon === "activity" && <Activity className="h-4 w-4 text-zinc-50" />}
              {metric.icon === "hard-drive" && <HardDrive className="h-4 w-4 text-zinc-50" />}
              {metric.icon === "cpu" && <Cpu className="h-4 w-4 text-zinc-50" />}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{metric.value}</span>
              {metric.suffix ? (
                <span className="text-sm font-medium text-zinc-400">{metric.suffix}</span>
              ) : null}
            </div>
            <p className={`mt-1 flex items-center gap-1 text-xs ${metric.tone === "success" ? "text-emerald-500" : metric.tone === "danger" ? "text-rose-500" : "text-zinc-400"}`}>
              {metric.trendDirection ? <TrendingUp className="h-3 w-3" /> : null}
              {metric.caption}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* System Alerts */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-zinc-400" />
                Active Alerts
              </h2>
            </div>
            <div className="px-6 py-8 text-center text-sm text-zinc-500">
              No active alerts. All systems are healthy.
            </div>
          </div>

          {/* Node Resources */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-sm font-semibold">Resource Usage Across Nodes</h2>
            </div>
            <div className="p-2">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 bg-zinc-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">Node</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">CPU</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg">Memory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {infrastructureNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-zinc-800/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {node.icon ? <node.icon className="h-4 w-4 text-zinc-400" /> : null}
                          <span className="font-medium text-zinc-50">{node.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                          {node.status === 'running' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {node.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                          {node.status === 'starting' && <Activity className="h-3.5 w-3.5 text-amber-500" />}
                          <span className="capitalize">{node.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${node.metrics?.cpu && node.metrics.cpu > 80 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${node.metrics?.cpu || 0}%` }}></div>
                          </div>
                          <span className="text-xs">{node.metrics?.cpu || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
             <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-sm font-semibold">Recent Deployments</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Deploy Item */}
              {overviewDeployments.map((deployment) => (
              <div key={deployment.title} className="flex gap-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${deployment.active ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-zinc-800"}`} />
                <div>
                  <p className="text-sm font-medium">{deployment.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{deployment.description}</p>
                </div>
              </div>
              ))}
            </div>
            <div className="border-t border-zinc-800 p-3">
              <button className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition flex items-center justify-center gap-1">
                View all deployments <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-sm font-semibold">Activity Feed</h2>
            </div>
            <div className="p-4 space-y-4">
              {overviewActivityFeed.map((item) => (
                <div key={`${item.message}-${item.time}`} className="flex gap-3 items-start">
                  {item.icon === "commit" && <GitCommit className="w-4 h-4 text-zinc-400 mt-0.5" />}
                  {item.icon === "alert" && <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />}
                  {item.icon === "check" && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />}
                  <div className="text-sm">
                    <p className="text-zinc-50">{item.message}</p>
                    <p className="text-xs text-zinc-400">{item.time}</p>
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
