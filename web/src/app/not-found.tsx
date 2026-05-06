"use client";

import { ErrorDisplay } from "@/components/errors/ErrorDisplay";

export default function NotFoundPage() {
  return <ErrorDisplay status={404} />;
}
