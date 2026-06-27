import type { PayPeriodType } from "@prisma/client";
import {
  formatPayPeriodLabel,
  getPayPeriodContaining,
  shiftPayPeriod,
  type PaySchedule,
} from "@/lib/timesheet/payPeriod";
import {
  getDefaultSubmissionAnchor,
  getTimedPayPeriodContaining,
  shiftTimedPayPeriod,
} from "@/lib/timesheet/payTiming";
import { endOfWeek, formatWeekLabel, startOfWeek } from "@/lib/timesheet/periods";

function stripDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

export function getSubmissionPeriodStart(today: Date, schedule: PaySchedule): Date {
  return getDefaultSubmissionAnchor(today, schedule);
}

export function getSubmissionDateRange(
  anchor: Date,
  schedule: PaySchedule,
): { start: Date; end: Date } {
  if (schedule.payPeriodType === "WEEKLY") {
    const start = startOfWeek(anchor);
    return { start, end: endOfWeek(start) };
  }

  if (schedule.payTimingMode === "PAY_IN_ARREARS") {
    return getPayPeriodContaining(anchor, schedule);
  }

  return getTimedPayPeriodContaining(anchor, schedule);
}

export function shiftSubmissionPeriod(
  currentStart: Date,
  schedule: PaySchedule,
  direction: -1 | 1,
): Date {
  if (schedule.payPeriodType === "WEEKLY" || schedule.payTimingMode === "PAY_IN_ARREARS") {
    return shiftPayPeriod(currentStart, schedule, direction);
  }
  return shiftTimedPayPeriod(currentStart, schedule, direction);
}

export function getLoggingPeriodContaining(date: Date, schedule: PaySchedule) {
  if (schedule.payTimingMode === "PAY_IN_ARREARS") {
    return getPayPeriodContaining(date, schedule);
  }
  return getTimedPayPeriodContaining(date, schedule);
}

export function getSubmissionScopeLabel(
  start: Date,
  end: Date,
  payPeriodType: PayPeriodType,
): string {
  if (payPeriodType === "WEEKLY") {
    return formatWeekLabel(start, end);
  }
  return formatPayPeriodLabel(start, end, payPeriodType);
}

export function usesWeeklySubmission(schedule: PaySchedule): boolean {
  return schedule.payPeriodType === "WEEKLY";
}

export function isSubmissionPeriodComplete(
  periodEnd: Date,
  today: Date = new Date(),
): boolean {
  return stripDate(today).getTime() > stripDate(periodEnd).getTime();
}

export function getIncompletePeriodWarning(periodEnd: Date): string {
  const endLabel = periodEnd.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `This work period ends on ${endLabel}. You can preview now, but wait until it closes before sending so no hours are missing.`;
}
