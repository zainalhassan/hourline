import { describe, expect, it } from "vitest";
import {
  createEntrySchema,
  createUserTemplateSchema,
  loginSchema,
  registerSchema,
  sendTimesheetSchema,
} from "@/lib/validations";

describe("validations", () => {
  it("validates register input", () => {
    const result = registerSchema.safeParse({
      name: "Demo",
      email: "demo@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords on register", () => {
    const result = registerSchema.safeParse({
      name: "Demo",
      email: "demo@test.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "demo@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("validates user template name", () => {
    expect(
      createUserTemplateSchema.safeParse({
        name: "My field sheet",
        forkedFrom: "FIELD_ENGINEER",
      }).success,
    ).toBe(true);
    expect(
      createUserTemplateSchema.safeParse({
        name: "",
        forkedFrom: "FIELD_ENGINEER",
      }).success,
    ).toBe(false);
  });

  it("validates time entry input", () => {
    expect(
      createEntrySchema.safeParse({
        entryDate: "2026-06-02",
        durationHours: 2,
        durationMinutes: 30,
      }).success,
    ).toBe(true);
  });

  it("rejects duration minutes above 59", () => {
    const result = createEntrySchema.safeParse({
      entryDate: "2026-06-02",
      durationHours: 1,
      durationMinutes: 60,
    });
    expect(result.success).toBe(false);
  });

  it("treats billable checkbox value on as true", () => {
    const result = createEntrySchema.safeParse({
      entryDate: "2026-06-02",
      durationHours: 1,
      durationMinutes: 0,
      billable: "on",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.billable).toBe(true);
  });

  it("accepts null for optional fields omitted from compact forms", () => {
    const result = createEntrySchema.safeParse({
      entryDate: "2026-06-27",
      durationHours: "1",
      durationMinutes: "0",
      client: "sa",
      project: null,
      taskDescription: null,
      mileageDescription: null,
      location: null,
      notes: null,
      billable: null,
      mileage: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates send timesheet input", () => {
    expect(
      sendTimesheetSchema.safeParse({
        periodId: "period_123",
      }).success,
    ).toBe(true);
    expect(sendTimesheetSchema.safeParse({ periodId: "" }).success).toBe(false);
  });
});
