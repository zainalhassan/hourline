import type { PayTimingMode, PeriodCloseMode } from "@prisma/client";
import {
  addDays,
  getLastWeekdayOfMonth,
  getPayPeriodContaining,
  shiftPayPeriod,
  type PaySchedule,
} from "@/lib/timesheet/payPeriod";

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function clampDayOfMonth(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}

function closeOnDay(year: number, month: number, day: number): Date {
  const clamped = clampDayOfMonth(year, month, day);
  return new Date(year, month, clamped, 12, 0, 0, 0);
}

export function getMonthlyPaydayDate(
  year: number,
  month: number,
  schedule: PaySchedule,
): Date {
  if (schedule.paydayMode === "LAST_WEEKDAY_OF_MONTH") {
    return getLastWeekdayOfMonth(year, month, schedule.paydayOfWeek);
  }
  return closeOnDay(year, month, schedule.paydayOfMonth);
}

function getRollingPeriodForCloseDay(date: Date, closeDay: number): { start: Date; end: Date } {
  const d = stripTime(date);
  let endMonth = d.getMonth();
  let endYear = d.getFullYear();
  let end = closeOnDay(endYear, endMonth, closeDay);

  if (d.getTime() > end.getTime()) {
    endMonth += 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
    end = closeOnDay(endYear, endMonth, closeDay);
  }

  let prevMonth = endMonth - 1;
  let prevYear = endYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevClose = closeOnDay(prevYear, prevMonth, closeDay);
  const start = addDays(prevClose, 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getRollingPeriodForDaysBeforePayday(
  date: Date,
  schedule: PaySchedule,
): { start: Date; end: Date } {
  const d = stripTime(date);
  const offset = schedule.periodCloseDaysBeforePayday;

  if (schedule.payPeriodType === "FORTNIGHTLY") {
    const { start, end: fortnightEnd } = getPayPeriodContaining(d, schedule);
    const periodEnd = addDays(fortnightEnd, -offset);
    periodEnd.setHours(23, 59, 59, 999);
    return { start, end: periodEnd };
  }

  let cursor = startOfMonth(d);
  for (let i = 0; i < 36; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const payday = getMonthlyPaydayDate(year, month, schedule);
    const periodEnd = addDays(payday, -offset);
    periodEnd.setHours(23, 59, 59, 999);

    const prevCursor = addMonths(cursor, -1);
    const prevPayday = getMonthlyPaydayDate(
      prevCursor.getFullYear(),
      prevCursor.getMonth(),
      schedule,
    );
    const prevPeriodEnd = addDays(prevPayday, -offset);
    const periodStart = addDays(prevPeriodEnd, 1);

    if (d.getTime() >= periodStart.getTime() && d.getTime() <= periodEnd.getTime()) {
      return { start: periodStart, end: periodEnd };
    }

    cursor = addMonths(cursor, 1);
  }

  const { start, end } = getPayPeriodContaining(d, schedule);
  return { start, end };
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

export function getTimedPayPeriodContaining(
  date: Date,
  schedule: PaySchedule,
): { start: Date; end: Date } {
  if (schedule.payPeriodType === "WEEKLY") {
    return getPayPeriodContaining(date, schedule);
  }

  if (schedule.payTimingMode === "PAY_IN_ARREARS") {
    return getPayPeriodContaining(date, schedule);
  }

  if (schedule.periodCloseMode === "DAY_OF_MONTH") {
    return getRollingPeriodForCloseDay(date, schedule.periodCloseDayOfMonth);
  }

  return getRollingPeriodForDaysBeforePayday(date, schedule);
}

export function getDefaultSubmissionAnchor(today: Date, schedule: PaySchedule): Date {
  if (schedule.payPeriodType === "WEEKLY") {
    return getPayPeriodContaining(today, schedule).start;
  }

  if (schedule.payTimingMode === "PAY_IN_ARREARS") {
    const { start } = getPayPeriodContaining(today, schedule);
    return shiftPayPeriod(start, schedule, -1);
  }

  return getTimedPayPeriodContaining(today, schedule).start;
}

export function getSubmissionTimingDescription(schedule: PaySchedule): string | null {
  if (schedule.payPeriodType === "WEEKLY") {
    return null;
  }

  if (schedule.payTimingMode === "PAY_IN_ARREARS") {
    return "Submit the previous period — paid in arrears on payday";
  }

  if (schedule.periodCloseMode === "DAY_OF_MONTH") {
    const day = schedule.periodCloseDayOfMonth;
    if (day >= 29) {
      return "Submit after the period closes on the last day of each month";
    }
    return `Submit after the period closes on the ${ordinal(day)} of each month`;
  }

  const days = schedule.periodCloseDaysBeforePayday;
  if (days === 0) {
    return "Submit after the period closes on payday";
  }
  if (days === 1) {
    return "Submit after the period closes the day before payday";
  }
  return `Submit after the period closes ${days} days before payday`;
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const last = day % 10;
  if (last === 1) return `${day}st`;
  if (last === 2) return `${day}nd`;
  if (last === 3) return `${day}rd`;
  return `${day}th`;
}

export function isPayInArrears(schedule: PaySchedule): boolean {
  return schedule.payTimingMode === "PAY_IN_ARREARS";
}

export type PayTimingFormValues = {
  payTimingMode: PayTimingMode;
  periodCloseMode: PeriodCloseMode;
  periodCloseDayOfMonth: number;
  periodCloseDaysBeforePayday: number;
};

export function shiftTimedPayPeriod(
  currentStart: Date,
  schedule: PaySchedule,
  direction: -1 | 1,
): Date {
  const { start, end } = getTimedPayPeriodContaining(currentStart, schedule);
  const probe = direction === -1 ? addDays(start, -1) : addDays(end, 1);
  return getTimedPayPeriodContaining(probe, schedule).start;
}

export function resolvePayTimingPersistence(
  payPeriodType: PaySchedule["payPeriodType"],
  timing: PayTimingFormValues,
): PayTimingFormValues {
  if (payPeriodType === "WEEKLY") {
    return {
      payTimingMode: "PAY_IN_ARREARS",
      periodCloseMode: "DAY_OF_MONTH",
      periodCloseDayOfMonth: 31,
      periodCloseDaysBeforePayday: 0,
    };
  }

  if (timing.payTimingMode === "PAY_IN_ARREARS") {
    return {
      payTimingMode: "PAY_IN_ARREARS",
      periodCloseMode: "DAY_OF_MONTH",
      periodCloseDayOfMonth: 31,
      periodCloseDaysBeforePayday: 0,
    };
  }

  return {
    payTimingMode: "PERIOD_CLOSES_ON",
    periodCloseMode:
      payPeriodType === "FORTNIGHTLY" ? "DAYS_BEFORE_PAYDAY" : timing.periodCloseMode,
    periodCloseDayOfMonth: timing.periodCloseDayOfMonth,
    periodCloseDaysBeforePayday: timing.periodCloseDaysBeforePayday,
  };
}

export const PERIOD_CLOSE_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return {
    value: day,
    label: day === 31 ? "Last day of month" : ordinal(day),
  };
});
