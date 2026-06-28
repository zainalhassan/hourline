import type { TimeEntry } from "@prisma/client";
import {
  getEntryFieldValue,
  getFieldLabel,
  getTableColumns,
  type ResolvedField,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { isPairLeftField, shouldSkipFieldInLoop } from "@/lib/timesheet/fieldLayouts";

export type PdfTableEntry = {
  durationMinutes: number;
  mileage: number | null;
  metadata: Record<string, unknown>;
};

export type PdfDisplayColumn = {
  id: string;
  label: string;
  fields: ResolvedField[];
};

function toTimeEntry(entry: PdfTableEntry): TimeEntry {
  return {
    durationMinutes: entry.durationMinutes,
    mileage: entry.mileage,
    metadata: entry.metadata,
  } as TimeEntry;
}

export function getPdfDisplayColumns(config: StoredFieldConfig): PdfDisplayColumn[] {
  const columns = getTableColumns(config);
  const display: PdfDisplayColumn[] = [];

  for (let index = 0; index < columns.length; index++) {
    const field = columns[index];
    if (shouldSkipFieldInLoop(field, columns, index)) continue;

    if (isPairLeftField(field, columns)) {
      const rightKey = field.fieldKey === "client" ? "notes" : "mileageDescription";
      const right = columns.find(
        (f) => f.kind === "builtIn" && f.fieldKey === rightKey,
      );
      if (right) {
        display.push({
          id: `${field.fieldKey}_${rightKey}`,
          label: `${getFieldLabel(field)} / ${getFieldLabel(right)}`,
          fields: [field, right],
        });
        continue;
      }
    }

    display.push({
      id: field.kind === "builtIn" ? field.fieldKey : field.id,
      label: getFieldLabel(field),
      fields: [field],
    });
  }

  return display;
}

export function formatPdfColumnValue(
  entry: PdfTableEntry,
  column: PdfDisplayColumn,
): string {
  const timeEntry = toTimeEntry(entry);

  if (column.fields.length === 1) {
    const value = getEntryFieldValue(timeEntry, column.fields[0]);
    return value.trim() ? value : "—";
  }

  const [left, right] = column.fields;
  const primary = getEntryFieldValue(timeEntry, left).trim();
  const secondary = getEntryFieldValue(timeEntry, right).trim();

  if (!primary && !secondary) return "—";
  if (!secondary) return primary || "—";
  if (!primary) return secondary;
  return `${primary}\n${secondary}`;
}

export function getPdfShiftBreakdown(
  entries: PdfTableEntry[],
  config: StoredFieldConfig,
): string | null {
  const shiftField = getTableColumns(config).find(
    (f) => f.kind === "custom" && f.id === "shift_type",
  );
  if (!shiftField || shiftField.kind !== "custom") return null;

  const counts = new Map<string, number>();
  for (const entry of entries) {
    const timeEntry = toTimeEntry(entry);
    const value = getEntryFieldValue(timeEntry, shiftField).trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  if (counts.size === 0) return null;

  const parts = (shiftField.options ?? [...counts.keys()])
    .filter((option) => counts.has(option))
    .map((option) => `${option} (${counts.get(option)})`);

  return parts.join(" · ");
}
