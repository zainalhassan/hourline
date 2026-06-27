import { describe, expect, it } from "vitest";
import {
  getDefaultPayViewAnchor,
  normalizePaySchedule,
} from "@/lib/timesheet/payPeriod";
import {
  getSubmissionDateRange,
  getSubmissionPeriodStart,
  getSubmissionScopeLabel,
  isSubmissionPeriodComplete,
  shiftSubmissionPeriod,
  usesWeeklySubmission,
} from "@/lib/timesheet/submissionScope";
import {
  getTimedPayPeriodContaining,
} from "@/lib/timesheet/payTiming";
import { toDateInputValue } from "@/lib/timesheet/periods";

describe("submission scope", () => {
  const monthly = normalizePaySchedule({
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

  const monthlyArrears = normalizePaySchedule({
    ...monthly,
    payTimingMode: "PAY_IN_ARREARS",
  });

  const monthlyClose25 = normalizePaySchedule({
    ...monthly,
    payTimingMode: "PERIOD_CLOSES_ON",
    periodCloseMode: "DAY_OF_MONTH",
    periodCloseDayOfMonth: 25,
  });

  const monthlyBeforePayday = normalizePaySchedule({
    ...monthly,
    payTimingMode: "PERIOD_CLOSES_ON",
    periodCloseMode: "DAYS_BEFORE_PAYDAY",
    periodCloseDaysBeforePayday: 3,
    paydayMode: "DAY_OF_MONTH",
    paydayOfMonth: 28,
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

  it("uses a week range for weekly schedules", () => {
    const anchor = new Date(2026, 5, 27, 12, 0, 0, 0);
    const { start, end } = getSubmissionDateRange(anchor, weekly);
    expect(toDateInputValue(start)).toBe("2026-06-22");
    expect(toDateInputValue(end)).toBe("2026-06-28");
    expect(usesWeeklySubmission(weekly)).toBe(true);
  });

  it("uses the full pay period for monthly arrears schedules", () => {
    const anchor = new Date(2026, 5, 27, 12, 0, 0, 0);
    const { start, end } = getSubmissionDateRange(anchor, monthly);
    expect(toDateInputValue(start)).toBe("2026-06-01");
    expect(toDateInputValue(end)).toBe("2026-06-30");
    expect(usesWeeklySubmission(monthly)).toBe(false);
  });

  it("defaults pay view to the previous period when paid in arrears", () => {
    const today = new Date(2026, 5, 27, 12, 0, 0, 0);
    const anchor = getDefaultPayViewAnchor(today, monthlyArrears);
    expect(toDateInputValue(anchor)).toBe("2026-05-01");
    const { start, end } = getSubmissionDateRange(anchor, monthlyArrears);
    expect(toDateInputValue(start)).toBe("2026-05-01");
    expect(toDateInputValue(end)).toBe("2026-05-31");
  });

  it("uses rolling close-day periods", () => {
    const today = new Date(2026, 3, 10, 12, 0, 0, 0);
    const { start, end } = getTimedPayPeriodContaining(today, monthlyClose25);
    expect(toDateInputValue(start)).toBe("2026-03-26");
    expect(toDateInputValue(end)).toBe("2026-04-25");
  });

  it("closes monthly periods days before payday", () => {
    const today = new Date(2026, 5, 20, 12, 0, 0, 0);
    const { start, end } = getTimedPayPeriodContaining(today, monthlyBeforePayday);
    expect(toDateInputValue(end)).toBe("2026-06-25");
    expect(toDateInputValue(start)).toBe("2026-05-26");
  });

  it("navigates rolling periods", () => {
    const periodStart = new Date(2026, 2, 26, 12, 0, 0, 0);
    const { start, end } = getSubmissionDateRange(periodStart, monthlyClose25);
    expect(toDateInputValue(end)).toBe("2026-04-25");
    const prev = shiftSubmissionPeriod(start, monthlyClose25, -1);
    const prevPeriod = getSubmissionDateRange(prev, monthlyClose25);
    expect(toDateInputValue(prevPeriod.end)).toBe("2026-03-25");
  });

  it("labels monthly submission scope", () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 30);
    expect(getSubmissionScopeLabel(start, end, "MONTHLY")).toBe("June 2026");
  });

  it("knows when a submission period is complete", () => {
    const periodEnd = new Date(2026, 5, 30, 12, 0, 0, 0);
    expect(isSubmissionPeriodComplete(periodEnd, new Date(2026, 5, 30))).toBe(false);
    expect(isSubmissionPeriodComplete(periodEnd, new Date(2026, 6, 1))).toBe(true);
  });

  it("resolves submission period start for arrears from today", () => {
    const today = new Date(2026, 5, 27, 12, 0, 0, 0);
    expect(toDateInputValue(getSubmissionPeriodStart(today, monthlyArrears))).toBe(
      "2026-05-01",
    );
    expect(toDateInputValue(getSubmissionPeriodStart(today, monthlyClose25))).toBe(
      "2026-06-26",
    );
  });
});
