import { describe, expect, it } from "vitest";
import { getDefaultFieldConfig } from "@/lib/timesheet/presets";
import {
  getPrefillFromEntry,
  parseEntryFromForm,
  validateEntryRequiredFields,
} from "@/lib/timesheet/entryForm";
import type { TimeEntry } from "@prisma/client";

function formDataFromRecord(data: Record<string, string | boolean>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "boolean") {
      if (value) fd.set(key, "on");
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: "entry_1",
    periodId: "period_1",
    entryDate: new Date(2026, 5, 3),
    durationMinutes: 90,
    mileage: null,
    metadata: {
      client: "Acme Ltd",
      project: "Site audit",
      billable: true,
      mileage: 12.5,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TimeEntry;
}

describe("entry form parsing", () => {
  const fieldEngineerConfig = getDefaultFieldConfig("FIELD_ENGINEER");

  it("parses built-in metadata and mileage from form data", () => {
    const formData = formDataFromRecord({
      client: "Acme Ltd",
      location: "Manchester",
      mileage: "15.5",
      durationHours: "2",
      durationMinutes: "0",
    });

    const { metadata, mileage } = parseEntryFromForm(formData, fieldEngineerConfig);

    expect(metadata.client).toBe("Acme Ltd");
    expect(metadata.location).toBe("Manchester");
    expect(metadata.mileage).toBe(15.5);
    expect(mileage).toBe(15.5);
  });

  it("parses custom fields from form data", () => {
    const config = {
      ...fieldEngineerConfig,
      custom: [
        {
          id: "vehicle_reg",
          label: "Vehicle reg",
          type: "text" as const,
          visible: true,
          required: false,
          sortOrder: 10,
        },
      ],
    };

    const formData = formDataFromRecord({
      custom_vehicle_reg: "AB12 CDE",
      durationHours: "1",
      durationMinutes: "0",
    });

    const { metadata } = parseEntryFromForm(formData, config);
    expect(metadata.vehicle_reg).toBe("AB12 CDE");
  });

  it("requires client for care support worker template", () => {
    const formData = formDataFromRecord({
      entryDate: "2026-06-03",
      durationHours: "1",
      durationMinutes: "0",
    });

    const error = validateEntryRequiredFields(formData, fieldEngineerConfig, 60);
    expect(error).toMatch(/client/i);
  });

  it("requires project for office desk template", () => {
    const officeConfig = getDefaultFieldConfig("OFFICE_DESK");
    const formData = formDataFromRecord({
      durationHours: "1",
      durationMinutes: "0",
    });

    const error = validateEntryRequiredFields(formData, officeConfig, 60);
    expect(error).toMatch(/project/i);
  });

  it("rejects zero duration when duration is required", () => {
    const formData = formDataFromRecord({
      client: "Acme Ltd",
      durationHours: "0",
      durationMinutes: "0",
    });

    const error = validateEntryRequiredFields(formData, fieldEngineerConfig, 0);
    expect(error).toMatch(/duration/i);
  });

  it("builds prefill values from the last entry", () => {
    const entry = makeEntry();
    const prefill = getPrefillFromEntry(entry);

    expect(prefill.client).toBe("Acme Ltd");
    expect(prefill.project).toBe("Site audit");
    expect(prefill.mileage).toBe("12.5");
  });

  it("treats missing billable checkbox as unchecked", () => {
    const formData = formDataFromRecord({
      client: "Acme Ltd",
      durationHours: "1",
      durationMinutes: "0",
    });

    const { metadata } = parseEntryFromForm(formData, getDefaultFieldConfig("CONSULTANT"));
    expect(metadata.billable).toBe(false);
  });
});
