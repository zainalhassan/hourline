import { z } from "zod";

function optionalFormString(max: number) {
  return z.preprocess(
    (v) => (v == null || v === "" ? undefined : v),
    z.string().max(max).optional(),
  );
}

const jobTitlePresetEnum = z.enum([
  "FIELD_ENGINEER",
  "OFFICE_DESK",
  "CONSULTANT",
  "FREELANCER",
]);

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateSubmissionSettingsSchema = z.object({
  employerName: z.string().max(100).optional(),
  employerEmail: z.string().email("Invalid employer email").optional().or(z.literal("")),
  ccSelfOnSubmit: z.coerce.boolean().optional(),
  submitMessage: z.string().max(2000).optional(),
});

export const updateActiveTemplateSchema = z.object({
  preset: jobTitlePresetEnum.optional(),
  userTemplateId: z.string().optional(),
});

export const createUserTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  forkedFrom: jobTitlePresetEnum,
});

export const updateUserTemplateSchema = createUserTemplateSchema;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createEntrySchema = z.object({
  entryDate: z.string().min(1, "Date is required"),
  durationHours: z.coerce.number().min(0).max(24),
  durationMinutes: z.coerce.number().min(0).max(59),
  mileage: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  client: optionalFormString(200),
  project: optionalFormString(200),
  taskDescription: optionalFormString(2000),
  mileageDescription: optionalFormString(2000),
  location: optionalFormString(200),
  notes: optionalFormString(5000),
  billable: z.preprocess(
    (v) => (v === "on" ? true : v === null || v === undefined ? undefined : v),
    z.coerce.boolean().optional(),
  ),
});

export const updateEntrySchema = createEntrySchema;

export const sendTimesheetSchema = z.object({
  periodId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

function payTimingFields() {
  return {
    payTimingMode: z.enum(["PAY_IN_ARREARS", "PERIOD_CLOSES_ON"]),
    periodCloseMode: z.enum(["DAY_OF_MONTH", "DAYS_BEFORE_PAYDAY"]),
    periodCloseDayOfMonth: z.coerce.number().min(1).max(31),
    periodCloseDaysBeforePayday: z.coerce.number().min(0).max(90),
  };
}

export const completeOnboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  preset: jobTitlePresetEnum,
  payPeriodType: z.enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY"]),
  paydayMode: z.enum(["DAY_OF_MONTH", "LAST_WEEKDAY_OF_MONTH"]),
  paydayOfWeek: z.coerce.number().min(0).max(6),
  paydayOfMonth: z.coerce.number().min(1).max(31),
  ...payTimingFields(),
  payPeriodAnchor: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().optional(),
  ),
  employerName: z.string().max(100).optional(),
  employerEmail: z.string().email("Invalid employer email").optional().or(z.literal("")),
  ccSelfOnSubmit: z.coerce.boolean().optional(),
  submitMessage: z.string().max(2000).optional(),
});

export const updatePayScheduleSchema = z.object({
  payPeriodType: z.enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY"]),
  paydayMode: z.enum(["DAY_OF_MONTH", "LAST_WEEKDAY_OF_MONTH"]),
  paydayOfWeek: z.coerce.number().min(0).max(6),
  paydayOfMonth: z.coerce.number().min(1).max(31),
  ...payTimingFields(),
  payPeriodAnchor: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().optional(),
  ),
});
