import type { TimeEntry } from "@prisma/client";
import {
  getVisibleResolvedFields,
  isFieldEmpty,
  normalizeFieldConfig,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { getFieldLabel } from "@/lib/timesheet/fieldConfig";

export function validatePeriodEntries(
  entries: TimeEntry[],
  fieldConfigRaw: unknown,
): string | null {
  if (entries.length === 0) {
    return "Add at least one entry before marking ready";
  }

  const fieldConfig = normalizeFieldConfig(fieldConfigRaw);
  const requiredFields = getVisibleResolvedFields(fieldConfig).filter((f) => f.required);

  for (const entry of entries) {
    const dateLabel = entry.entryDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    for (const field of requiredFields) {
      if (isFieldEmpty(entry, field)) {
        return `${getFieldLabel(field)} is required on ${dateLabel}`;
      }
    }
  }

  return null;
}
