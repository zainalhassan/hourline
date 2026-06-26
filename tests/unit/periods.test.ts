import { describe, expect, it } from "vitest";
import {
  addWeeks,
  endOfWeek,
  formatDuration,
  parseDurationInput,
  startOfWeek,
} from "@/lib/timesheet/periods";

describe("timesheet periods", () => {
  it("normalizes to Monday week start", () => {
    const wednesday = new Date(2026, 5, 3);
    const start = startOfWeek(wednesday);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(5);
  });

  it("computes week end as Sunday", () => {
    const start = startOfWeek(new Date(2026, 5, 3));
    const end = endOfWeek(start);
    expect(end.getDay()).toBe(0);
    expect(end.getDate()).toBe(7);
    expect(end.getMonth()).toBe(5);
  });

  it("adds and subtracts weeks", () => {
    const start = startOfWeek(new Date(2026, 5, 3));
    const next = addWeeks(start, 1);
    const prev = addWeeks(start, -1);
    expect(next.getDate()).toBe(8);
    expect(prev.getDate()).toBe(25);
    expect(prev.getMonth()).toBe(4);
  });

  it("formats duration", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(0)).toBe("0m");
  });

  it("parses duration input", () => {
    expect(parseDurationInput("2", "30")).toBe(150);
    expect(parseDurationInput("", "45")).toBe(45);
  });
});
