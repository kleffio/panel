import { Badge, cn } from "@kleffio/ui";
import type { GameServerPlanTier } from "@/types";

interface PlanBadgeProps {
  tier: GameServerPlanTier;
  className?: string;
}

const PLAN_CONFIG: Record<GameServerPlanTier, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20" },
  starter: { label: "Starter", className: "bg-blue-500/10 text-blue-400 ring-blue-500/20" },
  pro: { label: "Pro", className: "bg-amber-400/10 text-amber-400 ring-amber-400/20" },
  business: { label: "Business", className: "bg-purple-500/10 text-purple-400 ring-purple-500/20" },
  enterprise: {
    label: "Enterprise",
    className: "bg-gradient-to-r from-amber-400/10 to-purple-500/10 text-amber-300 ring-amber-400/20",
  },
};

export function PlanBadge({ tier, className }: PlanBadgeProps) {
  const config = PLAN_CONFIG[tier];

  return (
    <Badge
      className={cn(
        "h-auto border-0 ring-1 ring-inset font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
