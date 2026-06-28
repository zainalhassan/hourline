"use client";

import type { TimeEntry } from "@prisma/client";
import { buildEntryDateRangeForWeek } from "@/lib/timesheet/payPeriod";
import {
  endOfWeek,
  formatDuration,
  startOfWeek,
  toDateInputValue,
} from "@/lib/timesheet/periods";
import { EntriesDayList } from "@/components/timesheet/EntriesDayList";
import type { StoredFieldConfig } from "@/lib/timesheet/fieldConfig";

type EntriesPayPeriodListProps = {
  entries: TimeEntry[];
  fieldConfig: StoredFieldConfig;
  canEdit: boolean;
  dateRange?: {
    min: string;
    max: string;
    default: string;
  };
};

type WeekBucket = {
  weekStart: string;
  weekStartDate: Date;
  weekEndDate: Date;
  label: string;
  totalMinutes: number;
  entries: TimeEntry[];
};

function groupEntriesByWeek(entries: TimeEntry[]): WeekBucket[] {
  const map = new Map<string, TimeEntry[]>();

  for (const entry of entries) {
    const start = startOfWeek(new Date(entry.entryDate));
    const key = toDateInputValue(start);
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekEntries]) => {
      const weekStartDate = startOfWeek(new Date(weekEntries[0].entryDate));
      const weekEndDate = endOfWeek(weekStartDate);
      return {
        weekStart,
        weekStartDate,
        weekEndDate,
        label: `${weekStartDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEndDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        totalMinutes: weekEntries.reduce((s, e) => s + e.durationMinutes, 0),
        entries: weekEntries,
      };
    });
}

export function EntriesPayPeriodList({
  entries,
  fieldConfig,
  canEdit,
}: EntriesPayPeriodListProps) {
  const weeks = groupEntriesByWeek(entries);

  if (weeks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No entries in this pay period yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {weeks.map((week) => {
        const weekDateRange = buildEntryDateRangeForWeek(
          week.weekStartDate,
          week.weekEndDate,
        );

        return (
          <section key={week.weekStart} className="space-y-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-sm font-semibold">Week {week.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(week.totalMinutes)} logged
              </p>
            </div>
            <EntriesDayList
              entries={week.entries}
              fieldConfig={fieldConfig}
              canEdit={canEdit}
              dateRange={weekDateRange}
            />
          </section>
        );
      })}
    </div>
  );
}
