import type { TimeEntry } from "@prisma/client";
import type { EntryMetadata } from "@/lib/timesheet/fields";
import { TIMESHEET_FIELDS } from "@/lib/timesheet/fields";
import {
  getVisibleResolvedFields,
  normalizeFieldConfig,
  resolvePeriodFieldConfig,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";

export function parseEntryFromForm(
  formData: FormData,
  fieldConfig: StoredFieldConfig,
): {
  metadata: EntryMetadata & Record<string, unknown>;
  mileage: number | null;
} {
  const metadata: EntryMetadata & Record<string, unknown> = {};
  let mileage: number | null = null;

  for (const field of getVisibleResolvedFields(fieldConfig)) {
    if (field.kind === "builtIn") {
      if (field.fieldKey === "durationMinutes") continue;
      if (field.fieldKey === "mileage") {
        const raw = String(formData.get("mileage") ?? "").trim();
        mileage = raw ? Number(raw) : null;
        if (mileage != null) metadata.mileage = mileage;
        continue;
      }
      if (field.fieldKey === "billable") {
        metadata.billable =
          formData.get("billable") === "on" || formData.get("billable") === "true";
        continue;
      }
      const value = String(formData.get(field.fieldKey) ?? "").trim();
      if (value) {
        metadata[field.fieldKey] = value;
      }
      continue;
    }

    const name = `custom_${field.id}`;
    if (field.type === "checkbox") {
      metadata[field.id] =
        formData.get(name) === "on" || formData.get(name) === "true";
      continue;
    }
    const value = String(formData.get(name) ?? "").trim();
    if (value) metadata[field.id] = value;
  }

  return { metadata, mileage };
}

export function validateEntryRequiredFields(
  formData: FormData,
  fieldConfig: StoredFieldConfig,
  durationMinutes: number,
): string | null {
  for (const field of getVisibleResolvedFields(fieldConfig)) {
    if (!field.required) continue;

    if (field.kind === "builtIn" && field.fieldKey === "durationMinutes") {
      if (durationMinutes <= 0) return "Duration is required";
      continue;
    }

    if (field.kind === "builtIn" && field.fieldKey === "mileage") {
      const raw = String(formData.get("mileage") ?? "").trim();
      if (!raw) return "Mileage is required";
      continue;
    }

    if (field.kind === "builtIn" && field.fieldKey === "billable") continue;

    if (field.kind === "builtIn") {
      const value = String(formData.get(field.fieldKey) ?? "").trim();
      if (!value) {
        return `${TIMESHEET_FIELDS[field.fieldKey].label} is required`;
      }
      continue;
    }

    if (field.type === "checkbox") continue;
    const value = String(formData.get(`custom_${field.id}`) ?? "").trim();
    if (!value) return `${field.label} is required`;
  }

  return null;
}

export function getPrefillFromEntry(entry: TimeEntry): Record<string, string> {
  const meta = (entry.metadata as Record<string, unknown>) ?? {};
  const values: Record<string, string> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (value != null && typeof value !== "boolean") {
      values[key] = String(value);
    }
  }

  if (entry.mileage != null) {
    values.mileage = String(entry.mileage);
  }

  return values;
}

export { resolvePeriodFieldConfig } from "@/lib/timesheet/fieldConfig";
