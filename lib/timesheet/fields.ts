export type FieldType = "text" | "textarea" | "number" | "duration" | "checkbox" | "date";

export type TimesheetFieldKey =
  | "client"
  | "project"
  | "taskDescription"
  | "durationMinutes"
  | "mileage"
  | "mileageDescription"
  | "location"
  | "notes"
  | "billable";

export type TimesheetFieldDefinition = {
  key: TimesheetFieldKey;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
};

export const TIMESHEET_FIELDS: Record<TimesheetFieldKey, TimesheetFieldDefinition> = {
  client: {
    key: "client",
    label: "Customer",
    type: "text",
    placeholder: "Who did you visit or support?",
  },
  project: {
    key: "project",
    label: "Project",
    type: "text",
    placeholder: "Project or workstream name",
  },
  taskDescription: {
    key: "taskDescription",
    label: "Task",
    type: "textarea",
    placeholder: "What did you work on?",
  },
  durationMinutes: {
    key: "durationMinutes",
    label: "Duration",
    type: "duration",
    hint: "Hours and minutes spent",
  },
  mileage: {
    key: "mileage",
    label: "Mileage (miles)",
    type: "number",
    placeholder: "0.00",
  },
  mileageDescription: {
    key: "mileageDescription",
    label: "Mileage notes",
    type: "textarea",
    placeholder: "Route or purpose",
  },
  location: {
    key: "location",
    label: "Location",
    type: "text",
    placeholder: "Site or address",
  },
  notes: {
    key: "notes",
    label: "Notes",
    type: "textarea",
    placeholder: "Additional details",
  },
  billable: {
    key: "billable",
    label: "Billable",
    type: "checkbox",
  },
};

export type TemplateFieldConfig = {
  fieldKey: TimesheetFieldKey;
  visible: boolean;
  required: boolean;
  defaultValue?: string;
  sortOrder: number;
};

export type EntryMetadata = {
  client?: string;
  project?: string;
  taskDescription?: string;
  mileageDescription?: string;
  location?: string;
  notes?: string;
  billable?: boolean;
};
