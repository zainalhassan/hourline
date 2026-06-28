import type { TimesheetFieldKey } from "@/lib/timesheet/fields";
import type { ResolvedField } from "@/lib/timesheet/fieldConfig";

export const BUILTIN_FIELD_PAIRS: [TimesheetFieldKey, TimesheetFieldKey][] = [
  ["client", "notes"],
  ["mileage", "mileageDescription"],
];

function getBuiltInFieldKey(field: ResolvedField): TimesheetFieldKey | null {
  return field.kind === "builtIn" ? field.fieldKey : null;
}

export function getPairPartnerKey(
  field: ResolvedField,
  fields: ResolvedField[],
): TimesheetFieldKey | null {
  const key = getBuiltInFieldKey(field);
  if (!key) return null;

  for (const [left, right] of BUILTIN_FIELD_PAIRS) {
    if (key === left && fields.some((f) => f.kind === "builtIn" && f.fieldKey === right)) {
      return right;
    }
    if (key === right) {
      const leftVisible = fields.some((f) => f.kind === "builtIn" && f.fieldKey === left);
      if (leftVisible) return left;
    }
  }

  return null;
}

export function shouldSkipFieldInLoop(
  field: ResolvedField,
  fields: ResolvedField[],
  index: number,
): boolean {
  const key = getBuiltInFieldKey(field);
  if (!key) return false;

  for (const [left, right] of BUILTIN_FIELD_PAIRS) {
    if (key !== right) continue;
    const leftIndex = fields.findIndex(
      (f) => f.kind === "builtIn" && f.fieldKey === left,
    );
    if (leftIndex >= 0 && leftIndex < index) return true;
  }

  return false;
}

export function isPairLeftField(
  field: ResolvedField,
  fields: ResolvedField[],
): field is ResolvedField & { kind: "builtIn"; fieldKey: TimesheetFieldKey } {
  if (field.kind !== "builtIn") return false;
  return BUILTIN_FIELD_PAIRS.some(
    ([left, right]) =>
      field.fieldKey === left &&
      fields.some((f) => f.kind === "builtIn" && f.fieldKey === right),
  );
}
