"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/errors/ErrorDisplay";
import { isApiError } from "@/lib/api";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const status = isApiError(error) ? (error.status ?? undefined) : undefined;

  return <ErrorDisplay status={status} message={error.message} onReset={reset} />;
}
