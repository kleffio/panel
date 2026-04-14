export function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

export const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  open: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  void: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};
