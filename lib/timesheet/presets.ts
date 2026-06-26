import { JobTitlePreset } from "@prisma/client";
import type { TemplateFieldConfig, TimesheetFieldKey } from "@/lib/timesheet/fields";
import type { StoredFieldConfig } from "@/lib/timesheet/fieldConfig";

export type PresetDefinition = {
  preset: JobTitlePreset;
  label: string;
  description: string;
  headerColor: string;
  fields: TemplateFieldConfig[];
};

function field(
  fieldKey: TimesheetFieldKey,
  sortOrder: number,
  options?: { required?: boolean; visible?: boolean },
): TemplateFieldConfig {
  return {
    fieldKey,
    sortOrder,
    visible: options?.visible ?? true,
    required: options?.required ?? false,
  };
}

export const JOB_TITLE_PRESETS: Record<JobTitlePreset, PresetDefinition> = {
  FIELD_ENGINEER: {
    preset: "FIELD_ENGINEER",
    label: "Field Engineer",
    description: "Site visits, client time, and mileage.",
    headerColor: "var(--color-route-blue)",
    fields: [
      field("durationMinutes", 0, { required: true }),
      field("client", 1, { required: true }),
      field("location", 2),
      field("mileage", 3),
      field("mileageDescription", 4),
      field("notes", 5),
    ],
  },
  OFFICE_DESK: {
    preset: "OFFICE_DESK",
    label: "Office / Desk",
    description: "Project and task time without travel.",
    headerColor: "var(--color-route-green)",
    fields: [
      field("durationMinutes", 0, { required: true }),
      field("project", 1, { required: true }),
      field("taskDescription", 2),
      field("notes", 3),
    ],
  },
  CONSULTANT: {
    preset: "CONSULTANT",
    label: "Consultant",
    description: "Client projects with billable tracking.",
    headerColor: "var(--color-route-purple)",
    fields: [
      field("durationMinutes", 0, { required: true }),
      field("client", 1, { required: true }),
      field("project", 2),
      field("billable", 3),
      field("notes", 4),
    ],
  },
  FREELANCER: {
    preset: "FREELANCER",
    label: "Freelancer",
    description: "Flexible client and project logging.",
    headerColor: "var(--color-route-orange)",
    fields: [
      field("durationMinutes", 0, { required: true }),
      field("client", 1, { required: true }),
      field("project", 2),
      field("taskDescription", 3),
      field("billable", 4),
      field("notes", 5),
    ],
  },
};

export const PRESET_LIST = Object.values(JOB_TITLE_PRESETS);

export function getPresetLabel(preset: JobTitlePreset): string {
  return JOB_TITLE_PRESETS[preset]?.label ?? preset;
}

export function getDefaultFieldConfig(preset: JobTitlePreset): StoredFieldConfig {
  return {
    builtIn: JOB_TITLE_PRESETS[preset].fields.map((f) => ({ ...f })),
    custom: [],
  };
}
