import type { TimeEntry } from "@prisma/client";
import {
  getEntryFieldValue,
  getFieldLabel,
  getTableColumns,
  type ResolvedField,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { groupEntriesByDay } from "@/lib/timesheet/entryGroups";
import { formatDuration } from "@/lib/timesheet/periods";
import { EntryActions } from "@/components/timesheet/EntryActions";

type EntryRow = TimeEntry & { period?: { status: string } };

function canEditEntry(entry: EntryRow, allowEdit: boolean) {
  if (!allowEdit) return false;
  if (entry.period) return entry.period.status !== "SENT";
  return true;
}

function getPrimaryField(
  entry: TimeEntry,
  columns: ResolvedField[],
): { label: string; value: string } | null {
  const shiftField = columns.find(
    (f) => f.kind === "custom" && f.id === "shift_type",
  );
  if (shiftField) {
    const value = getEntryFieldValue(entry, shiftField);
    if (value) return { label: getFieldLabel(shiftField), value };
  }

  const priority = ["client", "project", "taskDescription", "location"];

  for (const key of priority) {
    const field = columns.find(
      (f) => f.kind === "builtIn" && f.fieldKey === key,
    );
    if (!field) continue;
    const value = getEntryFieldValue(entry, field);
    if (value) return { label: getFieldLabel(field), value };
  }

  for (const field of columns) {
    const value = getEntryFieldValue(entry, field);
    if (value) return { label: getFieldLabel(field), value };
  }

  return null;
}

function getSecondaryFields(
  entry: TimeEntry,
  columns: ResolvedField[],
  primary: { label: string; value: string } | null,
) {
  return columns
    .map((field) => ({
      label: getFieldLabel(field),
      value: getEntryFieldValue(entry, field),
    }))
    .filter(
      (field) =>
        field.value &&
        !(primary && field.label === primary.label && field.value === primary.value),
    )
    .slice(0, 3);
}

type EntriesDayListProps = {
  entries: EntryRow[];
  fieldConfig: StoredFieldConfig;
  canEdit: boolean;
  dateRange?: {
    min: string;
    max: string;
    default: string;
  };
};

export function EntriesDayList({
  entries,
  fieldConfig,
  canEdit,
  dateRange,
}: EntriesDayListProps) {
  const columns = getTableColumns(fieldConfig);
  const days = groupEntriesByDay(entries);

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.dateKey} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-0.5">
            <h3 className="text-sm font-semibold">{day.label}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDuration(day.totalMinutes)}
              <span className="mx-1">·</span>
              {day.entries.length} {day.entries.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          <ul className="space-y-2">
            {day.entries.map((entry) => {
              const primary = getPrimaryField(entry, columns);
              const secondary = getSecondaryFields(entry, columns, primary);

              return (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                          {formatDuration(entry.durationMinutes)}
                        </span>
                        {primary ? (
                          <span className="truncate text-sm font-medium">
                            {primary.value}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Time logged</span>
                        )}
                      </div>

                      {secondary.length > 0 ? (
                        <dl className="space-y-1 text-xs text-muted-foreground">
                          {secondary.map((field) => (
                            <div key={field.label} className="flex gap-2">
                              <dt className="shrink-0 font-medium">{field.label}</dt>
                              <dd className="min-w-0 truncate">{field.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>

                    {canEditEntry(entry, canEdit) ? (
                      <EntryActions
                        entry={entry}
                        fieldConfig={fieldConfig}
                        periodId={entry.periodId}
                        dateRange={dateRange}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
