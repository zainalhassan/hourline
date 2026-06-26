import { describe, expect, it } from "vitest";
import { JOB_TITLE_PRESETS, PRESET_LIST } from "@/lib/timesheet/presets";

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

  it("includes mileage on field engineer preset", () => {
    const fieldEngineer = JOB_TITLE_PRESETS.FIELD_ENGINEER;
    expect(fieldEngineer.fields.some((f) => f.fieldKey === "mileage")).toBe(true);
  });
});
