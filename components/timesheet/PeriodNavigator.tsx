"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PeriodNavigatorProps = {
  label: string;
  prevHref: string;
  nextHref: string;
  prevLabel?: string;
  nextLabel?: string;
};

export function PeriodNavigator({
  label,
  prevHref,
  nextHref,
  prevLabel = "Previous",
  nextLabel = "Next",
}: PeriodNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={prevHref}>
          <ChevronLeft className="size-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">{prevLabel}</span>
        </Link>
      </Button>
      <p className="text-center text-sm font-semibold sm:text-base">{label}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href={nextHref}>
          <span className="sr-only sm:not-sr-only sm:mr-1">{nextLabel}</span>
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
