import { describe, expect, it } from "vitest";
import {
  normalizeFieldConfig,
  slugifyCustomFieldId,
  validateCustomFieldDefinitions,
} from "@/lib/timesheet/fieldConfig";

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
});
