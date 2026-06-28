import type { TimeEntry } from "@prisma/client";
import type { PeriodStatus } from "@prisma/client";
import type {
  EntryMetadata,
  TemplateFieldConfig,
  TimesheetFieldKey,
} from "@/lib/timesheet/fields";
import { TIMESHEET_FIELDS } from "@/lib/timesheet/fields";

export type CustomFieldType = "text" | "number" | "textarea" | "checkbox" | "select";

export type CustomFieldDefinition = {
  id: string;
  label: string;
  type: CustomFieldType;
  visible: boolean;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  sortOrder: number;
};

export type StoredFieldConfig = {
  builtIn: TemplateFieldConfig[];
  custom: CustomFieldDefinition[];
};

export type ResolvedBuiltInField = TemplateFieldConfig & {
  kind: "builtIn";
  fieldKey: TimesheetFieldKey;
};

export type ResolvedCustomField = CustomFieldDefinition & {
  kind: "custom";
};

export type ResolvedField = ResolvedBuiltInField | ResolvedCustomField;

export const MAX_CUSTOM_FIELDS = 10;

const BUILT_IN_KEYS = new Set<string>(Object.keys(TIMESHEET_FIELDS));

export function normalizeSelectOptions(options: string[] | undefined): string[] {
  if (!options?.length) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const option of options) {
    const trimmed = option.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

function normalizeCustomField(field: CustomFieldDefinition): CustomFieldDefinition {
  if (field.type !== "select") {
    const { options: _options, ...rest } = field;
    return rest;
  }
  return {
    ...field,
    options: normalizeSelectOptions(field.options),
  };
}

export function slugifyCustomFieldId(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}_${suffix}` : `field_${suffix}`;
}

export function normalizeFieldConfig(raw: unknown): StoredFieldConfig {
  if (Array.isArray(raw)) {
    return {
      builtIn: raw as TemplateFieldConfig[],
      custom: [],
    };
  }

  if (raw && typeof raw === "object" && "builtIn" in raw) {
    const obj = raw as StoredFieldConfig;
    return {
      builtIn: Array.isArray(obj.builtIn) ? obj.builtIn : [],
      custom: Array.isArray(obj.custom)
        ? obj.custom.slice(0, MAX_CUSTOM_FIELDS).map(normalizeCustomField)
        : [],
    };
  }

  return { builtIn: [], custom: [] };
}

export function getResolvedFields(config: StoredFieldConfig): ResolvedField[] {
  const builtIn: ResolvedField[] = config.builtIn.map((f) => ({
    ...f,
    kind: "builtIn" as const,
  }));
  const custom: ResolvedField[] = config.custom
    .filter((f) => f.visible)
    .map((f) => ({ ...f, kind: "custom" as const }));
  return [...builtIn, ...custom].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVisibleResolvedFields(config: StoredFieldConfig): ResolvedField[] {
  return getResolvedFields(config).filter((f) => f.visible);
}

export function getFieldLabel(field: ResolvedField): string {
  if (field.kind === "builtIn") {
    return TIMESHEET_FIELDS[field.fieldKey].label;
  }
  return field.label;
}

export function getMileageFromEntry(entry: TimeEntry): number | null {
  if (entry.mileage != null) return Number(entry.mileage);
  const meta = (entry.metadata as EntryMetadata & Record<string, unknown>) ?? {};
  if (meta.mileage != null && meta.mileage !== "") {
    return Number(meta.mileage);
  }
  return null;
}

export function getEntryFieldValue(
  entry: TimeEntry,
  field: ResolvedField,
): string {
  const meta = (entry.metadata as EntryMetadata & Record<string, unknown>) ?? {};

  if (field.kind === "builtIn") {
    if (field.fieldKey === "durationMinutes") {
      return String(entry.durationMinutes);
    }
    if (field.fieldKey === "mileage") {
      const m = getMileageFromEntry(entry);
      return m != null ? String(m) : "";
    }
    if (field.fieldKey === "billable") {
      return meta.billable ? "Yes" : "No";
    }
    const value = meta[field.fieldKey as keyof EntryMetadata];
    return value != null ? String(value) : "";
  }

  const value = meta[field.id];
  if (field.type === "checkbox") {
    return value ? "Yes" : "No";
  }
  return value != null && String(value).trim() ? String(value) : "";
}

export function isFieldEmpty(entry: TimeEntry, field: ResolvedField): boolean {
  if (field.kind === "builtIn") {
    if (field.fieldKey === "durationMinutes") {
      return entry.durationMinutes <= 0;
    }
    if (field.fieldKey === "mileage") {
      return getMileageFromEntry(entry) == null;
    }
    if (field.fieldKey === "billable") {
      return false;
    }
    return !getEntryFieldValue(entry, field).trim();
  }

  const meta = (entry.metadata as Record<string, unknown>) ?? {};
  const value = meta[field.id];
  if (field.type === "checkbox") return false;
  return value == null || !String(value).trim();
}

export function validateCustomFieldDefinitions(
  custom: CustomFieldDefinition[],
): string | null {
  if (custom.length > MAX_CUSTOM_FIELDS) {
    return `Maximum ${MAX_CUSTOM_FIELDS} custom columns allowed`;
  }

  const ids = new Set<string>();
  for (const field of custom) {
    if (!field.label.trim()) return "Custom column label is required";
    if (!field.id.trim()) return "Custom column id is required";
    if (BUILT_IN_KEYS.has(field.id)) {
      return `Column id "${field.id}" conflicts with a built-in field`;
    }
    if (ids.has(field.id)) return `Duplicate column id "${field.id}"`;
    ids.add(field.id);

    if (field.type === "select") {
      const options = normalizeSelectOptions(field.options);
      if (options.length === 0) {
        return `Select column "${field.label}" needs at least one option`;
      }
      if (
        field.defaultValue &&
        !options.includes(field.defaultValue.trim())
      ) {
        return `Default value for "${field.label}" must be one of its options`;
      }
    }
  }

  return null;
}

export function parseStoredFieldConfigFromForm(formData: FormData): StoredFieldConfig | null {
  const raw = formData.get("fieldConfig");
  if (typeof raw !== "string") return null;
  try {
    const config = normalizeFieldConfig(JSON.parse(raw));
    const error = validateCustomFieldDefinitions(config.custom);
    if (error) return null;
    return config;
  } catch {
    return null;
  }
}

export function getTableColumns(config: StoredFieldConfig): ResolvedField[] {
  return getVisibleResolvedFields(config).filter(
    (f) =>
      !(f.kind === "builtIn" && f.fieldKey === "durationMinutes"),
  );
}

/** Use the active template while a period is editable; freeze on snapshot once sent. */
export function resolvePeriodFieldConfig(
  snapshot: unknown,
  activeConfig: StoredFieldConfig,
  periodStatus?: PeriodStatus | null,
): StoredFieldConfig {
  if (periodStatus === "SENT" && snapshot) {
    return normalizeFieldConfig(snapshot);
  }
  return activeConfig;
}
