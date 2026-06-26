import type { TimeEntry } from "@prisma/client";
import {
  getEntryFieldValue,
  getFieldLabel,
  getTableColumns,
  normalizeFieldConfig,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { formatDuration } from "@/lib/timesheet/periods";

export function buildTimesheetCsv(
  fieldConfigRaw: unknown,
  entries: TimeEntry[],
): string {
  const fieldConfig = normalizeFieldConfig(fieldConfigRaw);
  const columns = getTableColumns(fieldConfig);

  const headers = ["Date", "Duration", ...columns.map((f) => getFieldLabel(f))];
  const rows = entries.map((entry) => {
    const date = entry.entryDate.toISOString().slice(0, 10);
    const duration = formatDuration(entry.durationMinutes);
    const values = columns.map((field) => {
      const raw = getEntryFieldValue(entry, field);
      return escapeCsv(raw);
    });
    return [date, duration, ...values].join(",");
  });

  return [headers.map(escapeCsv).join(","), ...rows].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
