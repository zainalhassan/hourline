"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeekLabel } from "@/lib/timesheet/periods";

type WeekSelectorProps = {
  weekStart: string;
  prevWeek: string;
  nextWeek: string;
};

export function WeekSelector({ weekStart, prevWeek, nextWeek }: WeekSelectorProps) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/?week=${prevWeek}`}>
          <ChevronLeft className="size-4" />
          Previous
        </Link>
      </Button>
      <p className="text-center text-sm font-semibold sm:text-base">
        {formatWeekLabel(start, end)}
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/?week=${nextWeek}`}>
          Next
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
