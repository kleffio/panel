"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Maximize2, RotateCcw, ScrollText, Sparkles } from "lucide-react";
import { memo, useEffect, useState } from "react";
import Link from "next/link";

import type { AiSuggestion, InfrastructureNode, NodeAction } from "@/features/hosting/model/types";
import { getStatusMeta } from "@/features/hosting/lib/infrastructure-graph";
import { Badge } from "@kleffio/ui";
import { Button } from "@kleffio/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kleffio/ui";

function PanelMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--test-muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/20">
        <div
          className="h-full rounded-full bg-[var(--test-accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--test-muted)]">{detail}</p>
    </div>
  );
}

export const NodeDetailsPanel = memo(function NodeDetailsPanel({
  node,
  open,
  onOpenChange,
  onAction,
  relatedNodes,
  suggestions,
}: {
  node: InfrastructureNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (nodeId: string, action: NodeAction) => void;
  relatedNodes: InfrastructureNode[];
  suggestions: AiSuggestion[];
}) {
  const status = node ? getStatusMeta(node.status) : null;
  const [hasEntered, setHasEntered] = useState(false);
  const entryInitial = hasEntered ? false : { opacity: 0, y: 14 };

  useEffect(() => {
    setHasEntered(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[430px] border-[var(--test-border)] bg-[var(--test-panel)] p-0 text-[var(--test-foreground)] backdrop-blur-2xl sm:max-w-[430px]"
      >
        {node ? (
          <>
            <SheetHeader className="border-b border-[var(--test-border)] p-6 pr-14">
              <div className="mb-3 flex flex-wrap gap-2">
                {node.badges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="border-[var(--test-border)] bg-white/5 text-[var(--test-muted)]"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
              <SheetTitle className="text-2xl font-semibold text-[var(--test-foreground)]">
                {node.panel.title}
              </SheetTitle>
              <SheetDescription className="mt-2 leading-6 text-[var(--test-muted)]">
                {node.panel.description}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <motion.div initial={entryInitial} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--test-muted)]">
                        Service health
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${status?.dotClassName}`} />
                        <span className={status?.textClassName}>{status?.label}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-[var(--test-muted)]">
                      <p>{node.metrics.traffic}</p>
                      <p className="mt-1">{node.metrics.ramLabel}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={entryInitial}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid gap-3"
              >
                <PanelMetric label="CPU" value={node.metrics.cpu} detail={node.metrics.traffic} />
                <PanelMetric label="RAM" value={node.metrics.ram} detail={node.metrics.ramLabel} />
              </motion.div>

              <motion.div
                initial={entryInitial}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid gap-3"
              >
                <h3 className="text-sm font-semibold">Quick actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10"
                    onClick={() => onAction(node.id, "restart")}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10"
                    onClick={() => onAction(node.id, "logs")}
                  >
                    <ScrollText className="h-4 w-4" />
                    Logs
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--test-border)] bg-white/5 text-[var(--test-foreground)] hover:bg-white/10"
                    onClick={() => onAction(node.id, "scale")}
                  >
                    <Maximize2 className="h-4 w-4" />
                    Scale
                  </Button>
                  {node.route ? (
                    <Button asChild className="bg-[var(--test-accent)] text-black hover:opacity-90">
                      <Link href={node.route}>
                        View
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </motion.div>

              <motion.div
                initial={entryInitial}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
              >
                <h3 className="mb-3 text-sm font-semibold">Operational notes</h3>
                <ul className="space-y-2 text-sm leading-6 text-[var(--test-muted)]">
                  {node.panel.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </motion.div>

              {suggestions.length > 0 ? (
                <motion.div
                  initial={entryInitial}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="rounded-[1.4rem] border border-amber-300/18 bg-amber-400/8 p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-amber-100">
                    <Sparkles className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">AI recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="rounded-2xl border border-white/8 bg-black/12 p-3">
                        <p className="font-medium text-[var(--test-foreground)]">{suggestion.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--test-muted)]">
                          {suggestion.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              <motion.div
                initial={entryInitial}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
              >
                <h3 className="mb-3 text-sm font-semibold">Related services</h3>
                <div className="grid gap-2">
                  {relatedNodes.map((relatedNode) => (
                    <div
                      key={relatedNode.id}
                      className="rounded-2xl border border-white/8 bg-black/12 px-3 py-2.5 text-sm text-[var(--test-muted)]"
                    >
                      <strong className="block text-[var(--test-foreground)]">{relatedNode.name}</strong>
                      <span className="mt-1 block">{relatedNode.subtitle}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}, (prev, next) =>
  prev.open === next.open &&
  prev.node?.id === next.node?.id &&
  prev.node?.status === next.node?.status &&
  prev.node?.metrics.cpu === next.node?.metrics.cpu &&
  prev.node?.metrics.ram === next.node?.metrics.ram &&
  prev.node?.metrics.ramLabel === next.node?.metrics.ramLabel &&
  prev.node?.metrics.traffic === next.node?.metrics.traffic &&
  prev.relatedNodes === next.relatedNodes &&
  prev.suggestions === next.suggestions
);
