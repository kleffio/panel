import type { Metadata } from "next";
import { BillingView } from "@/features/billing/pages/BillingView";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return <BillingView />;
}
