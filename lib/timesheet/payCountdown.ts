import { addDays, getPayPeriodContaining, type PaySchedule } from "@/lib/timesheet/payPeriod";
import { getMonthlyPaydayDate } from "@/lib/timesheet/payTiming";
import { getLoggingPeriodContaining } from "@/lib/timesheet/submissionScope";

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

/** Next payday on or after today (end of that calendar day). */
export function getNextPaydayDate(today: Date, schedule: PaySchedule): Date {
  const d = stripTime(today);

  if (schedule.payPeriodType === "WEEKLY") {
    let daysAhead = schedule.paydayOfWeek - d.getDay();
    if (daysAhead < 0) daysAhead += 7;
    return endOfDay(addDays(d, daysAhead));
  }

  if (schedule.payPeriodType === "FORTNIGHTLY") {
    let { start, end } = getPayPeriodContaining(d, schedule);
    let payday = end;

    if (
      schedule.payTimingMode === "PERIOD_CLOSES_ON" &&
      schedule.periodCloseMode === "DAYS_BEFORE_PAYDAY"
    ) {
      payday = endOfDay(addDays(stripTime(end), schedule.periodCloseDaysBeforePayday));
    }

    if (stripTime(payday).getTime() >= d.getTime()) {
      return endOfDay(payday);
    }

    const next = getPayPeriodContaining(addDays(end, 1), schedule);
    payday = next.end;
    if (
      schedule.payTimingMode === "PERIOD_CLOSES_ON" &&
      schedule.periodCloseMode === "DAYS_BEFORE_PAYDAY"
    ) {
      payday = endOfDay(
        addDays(stripTime(next.end), schedule.periodCloseDaysBeforePayday),
      );
    }
    return endOfDay(payday);
  }

  let cursor = startOfMonth(d);
  for (let i = 0; i < 24; i++) {
    const payday = getMonthlyPaydayDate(cursor.getFullYear(), cursor.getMonth(), schedule);
    if (stripTime(payday).getTime() >= d.getTime()) {
      return endOfDay(payday);
    }
    cursor = addMonths(cursor, 1);
  }

  return endOfDay(getMonthlyPaydayDate(d.getFullYear(), d.getMonth(), schedule));
}

/** When the current logging period closes (last moment to log hours for it). */
export function getTimesheetDeadline(today: Date, schedule: PaySchedule): Date {
  const { end } = getLoggingPeriodContaining(today, schedule);
  return end;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
};

export function getCountdownParts(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(totalMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes, totalMs };
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.totalMs <= 0) return "Now";
  if (parts.days > 0) return `${parts.days}d ${parts.hours}h`;
  if (parts.hours > 0) return `${parts.hours}h ${parts.minutes}m`;
  if (parts.minutes > 0) return `${parts.minutes}m`;
  return "<1m";
}

export function formatCountdownDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
