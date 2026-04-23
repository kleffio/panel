"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";

export default function RootPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    router.replace("/account");
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return null;
}
