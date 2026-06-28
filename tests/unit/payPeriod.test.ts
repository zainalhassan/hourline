import { describe, expect, it } from "vitest";
import {
  buildEntryDateRangeForPayPeriod,
  buildEntryDateRangeForWeek,
  getLastWeekdayOfMonth,
  getPayPeriodContaining,
  getPaydayDescription,
  isDateInRange,
  normalizePaySchedule,
  parseViewParam,
} from "@/lib/timesheet/payPeriod";
import { endOfWeek, startOfWeek } from "@/lib/timesheet/periods";

describe("pay period", () => {
  const weekly = normalizePaySchedule({
    payPeriodType: "WEEKLY",
    paydayMode: "DAY_OF_MONTH",
    paydayOfWeek: 5,
    paydayOfMonth: 28,
    payPeriodAnchor: null,
    payTimingMode: "PAY_IN_ARREARS",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 0,
  });

  it("calculates weekly bounds", () => {
    const date = new Date(2026, 5, 27, 12, 0, 0, 0);
    const { start, end } = getPayPeriodContaining(date, weekly);
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
    expect(isDateInRange(date, start, end)).toBe(true);
  });

  it("calculates monthly bounds", () => {
    const monthly = normalizePaySchedule({
      payPeriodType: "MONTHLY",
      paydayMode: "DAY_OF_MONTH",
      paydayOfWeek: 5,
      paydayOfMonth: 28,
    payPeriodAnchor: null,
    payTimingMode: "PAY_IN_ARREARS",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 0,
  });
    const date = new Date(2026, 5, 15);
    const { start, end } = getPayPeriodContaining(date, monthly);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(5);
    expect(end.getDate()).toBe(30);
  });

  it("defaults to pay view for non-weekly schedules", () => {
    const monthly = normalizePaySchedule({
      payPeriodType: "MONTHLY",
      paydayMode: "DAY_OF_MONTH",
      paydayOfWeek: 5,
      paydayOfMonth: 28,
    payPeriodAnchor: null,
    payTimingMode: "PAY_IN_ARREARS",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 0,
  });
    expect(parseViewParam(undefined, monthly)).toBe("pay");
    expect(parseViewParam(undefined, { ...monthly, payPeriodType: "WEEKLY" })).toBe(
      "week",
    );
  });

  it("describes end-of-month payday when day is 29–31", () => {
    const schedule = normalizePaySchedule({
      payPeriodType: "MONTHLY",
      paydayMode: "DAY_OF_MONTH",
      paydayOfWeek: 5,
      paydayOfMonth: 31,
    payPeriodAnchor: null,
    payTimingMode: "PAY_IN_ARREARS",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 0,
  });
    expect(getPaydayDescription(schedule)).toBe(
      "Paid on the 31st of each month (or the last day in shorter months)",
    );
  });

  it("describes last Friday of the month payday", () => {
    const schedule = normalizePaySchedule({
      payPeriodType: "MONTHLY",
      paydayMode: "LAST_WEEKDAY_OF_MONTH",
      paydayOfWeek: 5,
      paydayOfMonth: 28,
    payPeriodAnchor: null,
    payTimingMode: "PAY_IN_ARREARS",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 0,
  });
    expect(getPaydayDescription(schedule)).toBe(
      "Paid on the last Friday of each month",
    );
  });

  it("finds the last Friday of a month", () => {
    const lastFriday = getLastWeekdayOfMonth(2026, 5, 5);
    expect(lastFriday.getDate()).toBe(26);
    expect(lastFriday.getDay()).toBe(5);
  });

  it("allows future days through the end of the viewed week", () => {
    const today = new Date(2026, 5, 27, 12, 0, 0, 0); // Saturday 27 Jun
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(weekStart);
    const range = buildEntryDateRangeForWeek(weekStart, weekEnd, today);

    expect(range.min).toBe("2026-06-22");
    expect(range.max).toBe("2026-06-28");
    expect(range.default).toBe("2026-06-27");
    expect(isDateInRange(new Date(2026, 5, 28, 12, 0, 0, 0), weekStart, weekEnd)).toBe(
      true,
    );
  });

  it("allows logging across weeks in a viewed pay period", () => {
    const today = new Date(2026, 5, 10, 12, 0, 0, 0);
    const payStart = new Date(2026, 5, 1, 12, 0, 0, 0);
    const payEnd = new Date(2026, 5, 30, 12, 0, 0, 0);
    const range = buildEntryDateRangeForPayPeriod(payStart, payEnd, today);

    expect(range.min).toBe("2026-06-01");
    expect(range.max).toBe("2026-06-30");
    expect(range.default).toBe("2026-06-10");

    const futureWeekDate = new Date(2026, 5, 25, 12, 0, 0, 0);
    expect(isDateInRange(futureWeekDate, payStart, payEnd)).toBe(true);
    expect(startOfWeek(futureWeekDate).getTime()).not.toBe(startOfWeek(today).getTime());
  });
});
