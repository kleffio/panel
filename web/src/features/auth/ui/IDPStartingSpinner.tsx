import { Spinner } from "@/components/ui/Spinner";

export function IDPStartingSpinner({
  variant = "page",
}: {
  variant?: "page" | "pane";
}) {
  return (
    <div
      className={
        variant === "page"
          ? "relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid"
          : "relative flex min-h-[34rem] items-center justify-center"
      }
    >
      {variant === "page" && <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />}
      <div
        className={`${variant === "page" ? "glass-panel" : "glass-panel-soft"} relative w-full max-w-sm space-y-6 p-8 text-center`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Panel
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 py-2">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted-foreground">Starting identity provider...</p>
          <p className="text-xs text-muted-foreground">This might take a while...</p>
        </div>
      </div>
    </div>
  );
}
