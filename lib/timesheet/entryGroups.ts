import type { TimeEntry } from "@prisma/client";
import { toDateInputValue } from "@/lib/timesheet/periods";

export type DayEntryGroup = {
  dateKey: string;
  date: Date;
  label: string;
  totalMinutes: number;
  entries: TimeEntry[];
};

export function groupEntriesByDay(entries: TimeEntry[]): DayEntryGroup[] {
  const map = new Map<string, TimeEntry[]>();

  for (const entry of entries) {
    const key = toDateInputValue(new Date(entry.entryDate));
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayEntries]) => {
      const date = new Date(dayEntries[0].entryDate);
      return {
        dateKey,
        date,
        label: date.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        totalMinutes: dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
        entries: dayEntries,
      };
    });
}
