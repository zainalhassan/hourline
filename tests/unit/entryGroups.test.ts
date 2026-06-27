import { describe, expect, it } from "vitest";
import type { TimeEntry } from "@prisma/client";
import { groupEntriesByDay } from "@/lib/timesheet/entryGroups";

function entry(id: string, y: number, m: number, d: number, minutes: number): TimeEntry {
  return {
    id,
    periodId: "period_1",
    entryDate: new Date(y, m - 1, d, 12, 0, 0, 0),
    durationMinutes: minutes,
    mileage: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as TimeEntry;
}

describe("groupEntriesByDay", () => {
  it("groups entries by calendar day with totals", () => {
    const groups = groupEntriesByDay([
      entry("1", 2026, 6, 27, 60),
      entry("2", 2026, 6, 27, 30),
      entry("3", 2026, 6, 28, 45),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].dateKey).toBe("2026-06-27");
    expect(groups[0].totalMinutes).toBe(90);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].dateKey).toBe("2026-06-28");
    expect(groups[1].totalMinutes).toBe(45);
  });
});
