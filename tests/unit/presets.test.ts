import { describe, expect, it } from "vitest";
import {
  getDefaultFieldConfig,
  JOB_TITLE_PRESETS,
  PRESET_LIST,
} from "@/lib/timesheet/presets";
import { normalizeFieldConfig } from "@/lib/timesheet/fieldConfig";

describe("job-title presets", () => {
  it("defines four built-in presets", () => {
    expect(PRESET_LIST).toHaveLength(4);
    expect(Object.keys(JOB_TITLE_PRESETS)).toEqual([
      "FIELD_ENGINEER",
      "OFFICE_DESK",
      "CONSULTANT",
      "FREELANCER",
    ]);
  });

  it("requires duration on every preset", () => {
    for (const preset of PRESET_LIST) {
      const duration = preset.fields.find((f) => f.fieldKey === "durationMinutes");
      expect(duration?.visible).toBe(true);
      expect(duration?.required).toBe(true);
    }
  });

  it("includes mileage on care support worker preset", () => {
    const fieldEngineer = JOB_TITLE_PRESETS.FIELD_ENGINEER;
    expect(fieldEngineer.fields.some((f) => f.fieldKey === "mileage")).toBe(true);
  });

  it("includes shift type select on care support worker preset", () => {
    const config = getDefaultFieldConfig("FIELD_ENGINEER");
    const shiftType = config.custom.find((f) => f.id === "shift_type");

    expect(shiftType).toMatchObject({
      label: "Shift type",
      type: "select",
      required: true,
      sortOrder: 1,
    });
    expect(shiftType?.options).toEqual([
      "Morning",
      "Lunch",
      "Tea Time",
      "Evening",
      "Bed time",
    ]);

    const client = config.builtIn.find((f) => f.fieldKey === "client");
    expect(client?.sortOrder).toBe(2);
    expect(client?.required).toBe(true);
  });

  it("default field config uses stored shape", () => {
    const config = normalizeFieldConfig({
      builtIn: JOB_TITLE_PRESETS.CONSULTANT.fields,
      custom: [],
    });
    expect(config.builtIn.length).toBeGreaterThan(0);
    expect(config.custom).toEqual([]);
  });
});
