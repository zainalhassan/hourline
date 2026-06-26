"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/transit/EmptyState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title="Something went wrong"
      description="An unexpected error occurred. Try again or return to your pipelines."
      className="min-h-[40vh] justify-center"
    >
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </EmptyState>
  );
}
