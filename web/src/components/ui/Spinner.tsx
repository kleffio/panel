import type { ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@kleffio/ui";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

type SpinnerProps = ComponentPropsWithoutRef<typeof Loader2> & {
  size?: SpinnerSize;
};

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  );
}
