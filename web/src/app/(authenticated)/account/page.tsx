import type { Metadata } from "next";
import { AccountHomePage } from "@/features/dashboard/pages/AccountHomePage";

export const metadata: Metadata = { title: "Account Home" };

export default function AccountPage() {
  return <AccountHomePage />;
}
