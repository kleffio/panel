import type { Metadata } from "next";
import { AccountSessionsPage } from "@/features/account/pages/AccountSessionsPage";

export const metadata: Metadata = { title: "Sessions" };

export default function AccountSessionsRoute() {
  return <AccountSessionsPage />;
}
