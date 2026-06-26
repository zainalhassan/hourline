import { z } from "zod";

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
  mileage: z.coerce.number().min(0).optional(),
  client: z.string().max(200).optional(),
  project: z.string().max(200).optional(),
  taskDescription: z.string().max(2000).optional(),
  mileageDescription: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  billable: z.coerce.boolean().optional(),
});

export const updateEntrySchema = createEntrySchema;

export const sendTimesheetSchema = z.object({
  periodId: z.string().min(1),
  message: z.string().max(2000).optional(),
});
