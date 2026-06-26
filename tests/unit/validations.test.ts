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

  it("validates send timesheet input", () => {
    expect(
      sendTimesheetSchema.safeParse({
        periodId: "period_123",
      }).success,
    ).toBe(true);
    expect(sendTimesheetSchema.safeParse({ periodId: "" }).success).toBe(false);
  });
});
