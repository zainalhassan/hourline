import { describe, expect, it } from "vitest";
import {
  addHourPreset,
  addMinutePreset,
  canAddHourPreset,
  formatDurationLabel,
  getHourPresets,
  getMinutePresets,
  normalizeDurationPresets,
  removeHourPreset,
} from "@/lib/timesheet/durationPresets";

describe("duration presets", () => {
  it("merges defaults with custom hour buttons", () => {
    const presets = normalizeDurationPresets({ customHours: [3, 6] });
    expect(getHourPresets(presets)).toEqual([0, 1, 2, 3, 4, 6, 8]);
  });

  it("merges defaults with custom minute buttons", () => {
    const presets = normalizeDurationPresets({ customMinutes: [10, 20] });
    expect(getMinutePresets(presets)).toEqual([0, 10, 15, 20, 30, 45]);
  });

  it("rejects duplicate default hour presets", () => {
    const stored = normalizeDurationPresets({});
    expect(canAddHourPreset(2, stored)).toMatch(/default/);
  });

  it("adds and removes custom hour presets", () => {
    const stored = normalizeDurationPresets({});
    const withCustom = addHourPreset(stored, 3);
    expect(getHourPresets(withCustom)).toContain(3);
    const without = removeHourPreset(withCustom, 3);
    expect(getHourPresets(without)).not.toContain(3);
  });

  it("formats combined duration labels", () => {
    expect(formatDurationLabel(1, 30)).toBe("1h 30m");
    expect(formatDurationLabel(0, 45)).toBe("45m");
    expect(formatDurationLabel(2, 0)).toBe("2h");
  });
});
