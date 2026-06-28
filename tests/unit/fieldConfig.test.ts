import { describe, expect, it } from "vitest";
import {
  normalizeFieldConfig,
  normalizeSelectOptions,
  resolvePeriodFieldConfig,
  slugifyCustomFieldId,
  validateCustomFieldDefinitions,
} from "@/lib/timesheet/fieldConfig";
import { getDefaultFieldConfig } from "@/lib/timesheet/presets";

describe("field config", () => {
  it("normalizes legacy array config", () => {
    const config = normalizeFieldConfig([
      { fieldKey: "client", visible: true, required: true, sortOrder: 0 },
    ]);
    expect(config.builtIn).toHaveLength(1);
    expect(config.custom).toEqual([]);
  });

  it("validates custom field ids", () => {
    const error = validateCustomFieldDefinitions([
      {
        id: "client",
        label: "Bad",
        type: "text",
        visible: true,
        required: false,
        sortOrder: 0,
      },
    ]);
    expect(error).toMatch(/conflicts/);
  });

  it("creates slug ids", () => {
    expect(slugifyCustomFieldId("Vehicle Reg")).toMatch(/^vehicle_reg_/);
  });

  it("normalizes select options", () => {
    expect(normalizeSelectOptions([" Morning ", "Lunch", "", "Lunch"])).toEqual([
      "Morning",
      "Lunch",
    ]);
  });

  it("requires options for select columns", () => {
    const error = validateCustomFieldDefinitions([
      {
        id: "shift_type",
        label: "Shift type",
        type: "select",
        visible: true,
        required: true,
        sortOrder: 0,
        options: [],
      },
    ]);
    expect(error).toMatch(/at least one option/i);
  });

  it("rejects invalid default for select columns", () => {
    const error = validateCustomFieldDefinitions([
      {
        id: "shift_type",
        label: "Shift type",
        type: "select",
        visible: true,
        required: false,
        sortOrder: 0,
        options: ["Morning", "Evening"],
        defaultValue: "Lunch",
      },
    ]);
    expect(error).toMatch(/must be one of its options/i);
  });

  it("uses active template for editable periods", () => {
    const staleSnapshot = { builtIn: [], custom: [] };
    const active = getDefaultFieldConfig("FIELD_ENGINEER");

    const resolved = resolvePeriodFieldConfig(staleSnapshot, active, "DRAFT");
    expect(resolved.custom.some((f) => f.id === "shift_type")).toBe(true);
  });

  it("keeps snapshot for sent periods", () => {
    const snapshot = { builtIn: [], custom: [] };
    const active = getDefaultFieldConfig("FIELD_ENGINEER");

    const resolved = resolvePeriodFieldConfig(snapshot, active, "SENT");
    expect(resolved).toEqual(snapshot);
  });
});
