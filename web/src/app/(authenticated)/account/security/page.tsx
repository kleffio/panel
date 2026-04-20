import type { Metadata } from "next";
import { AccountSecurityPage } from "@/features/account/pages/AccountSecurityPage";

export const metadata: Metadata = { title: "Security" };

export default function AccountSecurityRoute() {
  return <AccountSecurityPage />;
}
