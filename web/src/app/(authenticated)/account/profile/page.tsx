import type { Metadata } from "next";
import { AccountProfilePage } from "@/features/account/pages/AccountProfilePage";

export const metadata: Metadata = { title: "Profile" };

export default function AccountProfileRoute() {
  return <AccountProfilePage />;
}
