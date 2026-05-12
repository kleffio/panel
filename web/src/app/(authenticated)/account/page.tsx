"use client";

import { AccountHomePage } from "@/features/dashboard/pages/AccountHomePage";
import { SimpleServersPage } from "@/features/hosting/pages/SimpleServersPage";
import { useViewMode } from "@/lib/hooks/useViewMode";

export default function AccountPage() {
  const { isSimplified } = useViewMode();

  if (isSimplified) return <SimpleServersPage />;
  return <AccountHomePage />;
}
