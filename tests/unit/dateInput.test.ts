import { describe, expect, it } from "vitest";
import { parseDateInput, toDateInputValue } from "@/lib/timesheet/periods";

describe("date input helpers", () => {
  it("round-trips a local calendar date", () => {
    const date = new Date(2026, 5, 3, 15, 30);
    expect(toDateInputValue(date)).toBe("2026-06-03");
    expect(parseDateInput("2026-06-03").getDate()).toBe(3);
    expect(parseDateInput("2026-06-03").getMonth()).toBe(5);
  });

  it("parses yyyy-mm-dd as the intended local day", () => {
    const parsed = parseDateInput("2026-06-03");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5);
    expect(parsed.getDate()).toBe(3);
    expect(toDateInputValue(parsed)).toBe("2026-06-03");
  });
});
