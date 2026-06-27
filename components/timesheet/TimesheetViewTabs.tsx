"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type TimesheetViewTabsProps = {
  activeView: "week" | "pay";
  weekStart: string;
  payStart: string;
};

export function TimesheetViewTabs({
  activeView,
  weekStart,
  payStart,
}: TimesheetViewTabsProps) {
  const tabs = [
    {
      id: "week" as const,
      label: "This week",
      href: `/?week=${weekStart}&view=week`,
    },
    {
      id: "pay" as const,
      label: "Pay period",
      href: `/?pay=${payStart}&view=pay`,
    },
  ];

  return (
    <div className="flex rounded-xl border border-border bg-muted/40 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
            activeView === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
