import { describe, expect, it } from "vitest";
import { normalizePaySchedule } from "@/lib/timesheet/payPeriod";
import {
  formatCountdown,
  formatCountdownDateKey,
  getCountdownParts,
  getCountdownTargetFromDateKey,
  getNextPaydayCalendarDate,
  getNextPaydayDate,
  getNextPaydayDateKey,
  getTimesheetDeadline,
  getTimesheetDeadlineKey,
} from "@/lib/timesheet/payCountdown";

describe("pay countdown", () => {
  const monthly = normalizePaySchedule({
    payPeriodType: "MONTHLY",
    paydayMode: "LAST_WEEKDAY_OF_MONTH",
    paydayOfWeek: 5,
    paydayOfMonth: 28,
    payPeriodAnchor: null,
    payTimingMode: "PERIOD_CLOSES_ON",
    periodCloseMode: "DAYS_BEFORE_PAYDAY",
    periodCloseDayOfMonth: 31,
    periodCloseDaysBeforePayday: 5,
  });

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

  it("finds the next Friday payday for weekly schedules", () => {
    const today = new Date(2026, 5, 24, 12, 0, 0, 0);
    const payday = getNextPaydayDate(today, weekly);
    expect(payday.getDay()).toBe(5);
    expect(payday.getDate()).toBe(26);
  });

  it("finds the next last-Friday payday for monthly schedules", () => {
    const today = new Date(2026, 5, 1, 12, 0, 0, 0);
    const payday = getNextPaydayDate(today, monthly);
    expect(payday.getDate()).toBe(26);
    expect(payday.getMonth()).toBe(5);
    expect(payday.getDay()).toBe(5);
  });

  it("keeps last-Friday payday on Friday when formatted from a date key", () => {
    const today = new Date(2026, 5, 27, 12, 0, 0, 0);
    const paydayKey = getNextPaydayDateKey(today, monthly);
    expect(paydayKey).toBe("2026-07-31");
    expect(getNextPaydayCalendarDate(today, monthly).getDay()).toBe(5);
    expect(formatCountdownDateKey(paydayKey)).toMatch(/Fri.*31.*Jul/);
  });

  it("counts down to the end of the local calendar day from a date key", () => {
    const target = getCountdownTargetFromDateKey("2026-07-31");
    const now = new Date(2026, 6, 31, 12, 0, 0, 0);
    const parts = getCountdownParts(target, now);
    expect(parts.totalMs).toBeGreaterThan(0);
    expect(target.getDate()).toBe(31);
    expect(target.getMonth()).toBe(6);
    expect(target.getDay()).toBe(5);
  });

  it("uses the logging period end as the timesheet deadline", () => {
    const today = new Date(2026, 5, 20, 12, 0, 0, 0);
    const deadline = getTimesheetDeadline(today, monthly);
    expect(deadline.getDate()).toBe(21);
    expect(deadline.getMonth()).toBe(5);
  });

  it("formats countdown labels", () => {
    const target = new Date(2026, 5, 28, 12, 0, 0, 0);
    const now = new Date(2026, 5, 27, 12, 0, 0, 0);
    expect(formatCountdown(getCountdownParts(target, now))).toBe("1d 0h");
  });
});
