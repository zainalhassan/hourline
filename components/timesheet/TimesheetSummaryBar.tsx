"use client";

import type { TimeEntry } from "@prisma/client";
import {
  getMileageFromEntry,
  getVisibleResolvedFields,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { formatDuration } from "@/lib/timesheet/periods";
import { CountdownTile } from "@/components/timesheet/CountdownTile";

type TimesheetSummaryBarProps = {
  entries: Pick<TimeEntry, "durationMinutes" | "mileage" | "metadata">[];
  fieldConfig: StoredFieldConfig;
  paydayIso: string;
  deadlineIso: string;
};

function isMileageVisible(fieldConfig: StoredFieldConfig): boolean {
  return getVisibleResolvedFields(fieldConfig).some(
    (field) => field.kind === "builtIn" && field.fieldKey === "mileage",
  );
}

function sumMileage(
  entries: Pick<TimeEntry, "durationMinutes" | "mileage" | "metadata">[],
): number {
  return entries.reduce(
    (sum, entry) => sum + (getMileageFromEntry(entry as TimeEntry) ?? 0),
    0,
  );
}

export function TimesheetSummaryBar({
  entries,
  fieldConfig,
  paydayIso,
  deadlineIso,
}: TimesheetSummaryBarProps) {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const showMileage = isMileageVisible(fieldConfig);
  const totalMileage = sumMileage(entries);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Hours</p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {formatDuration(totalMinutes)}
        </p>
      </div>
      {showMileage ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Mileage</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {totalMileage.toFixed(1)}
            <span className="ml-1 text-base font-medium text-muted-foreground">mi</span>
          </p>
        </div>
      ) : null}
      <CountdownTile label="Payday in" targetIso={paydayIso} pastLabel="Today" />
      <CountdownTile
        label="Period closes in"
        targetIso={deadlineIso}
        pastLabel="Closed"
      />
    </div>
  );
}
