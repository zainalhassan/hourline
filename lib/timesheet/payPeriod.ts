import type { PaydayMode, PayPeriodType, PayTimingMode, PeriodCloseMode, User } from "@prisma/client";
import { getDefaultSubmissionAnchor, getSubmissionTimingDescription } from "@/lib/timesheet/payTiming";
import {
  addWeeks,
  endOfWeek,
  parseDateInput,
  startOfWeek,
  toDateInputValue,
} from "@/lib/timesheet/periods";

export type PaySchedule = {
  payPeriodType: PayPeriodType;
  paydayMode: PaydayMode;
  paydayOfWeek: number;
  paydayOfMonth: number;
  payPeriodAnchor: Date | null;
  payTimingMode: PayTimingMode;
  periodCloseMode: PeriodCloseMode;
  periodCloseDayOfMonth: number;
  periodCloseDaysBeforePayday: number;
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function normalizePaySchedule(
  user: Pick<
    User,
    | "payPeriodType"
    | "paydayMode"
    | "paydayOfWeek"
    | "paydayOfMonth"
    | "payPeriodAnchor"
    | "payTimingMode"
    | "periodCloseMode"
    | "periodCloseDayOfMonth"
    | "periodCloseDaysBeforePayday"
  >,
): PaySchedule {
  return {
    payPeriodType: user.payPeriodType ?? "WEEKLY",
    paydayMode: user.paydayMode ?? "DAY_OF_MONTH",
    paydayOfWeek: clamp(user.paydayOfWeek ?? 5, 0, 6),
    paydayOfMonth: clamp(user.paydayOfMonth ?? 28, 1, 31),
    payPeriodAnchor: user.payPeriodAnchor ? new Date(user.payPeriodAnchor) : null,
    payTimingMode:
      user.payPeriodType === "WEEKLY"
        ? "PAY_IN_ARREARS"
        : (user.payTimingMode ?? "PAY_IN_ARREARS"),
    periodCloseMode: user.periodCloseMode ?? "DAY_OF_MONTH",
    periodCloseDayOfMonth: clamp(user.periodCloseDayOfMonth ?? 31, 1, 31),
    periodCloseDaysBeforePayday: clamp(user.periodCloseDaysBeforePayday ?? 0, 0, 90),
  };
}

export function getLastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
): Date {
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0);
  let day = lastDay.getDate();
  while (new Date(year, month, day, 12, 0, 0, 0).getDay() !== weekday) {
    day -= 1;
  }
  return new Date(year, month, day, 12, 0, 0, 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const t = stripTime(date).getTime();
  return t >= stripTime(start).getTime() && t <= stripTime(end).getTime();
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function diffDays(a: Date, b: Date): number {
  const ms = stripTime(b).getTime() - stripTime(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getPayPeriodContaining(
  date: Date,
  schedule: PaySchedule,
): { start: Date; end: Date } {
  switch (schedule.payPeriodType) {
    case "MONTHLY":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "FORTNIGHTLY": {
      const anchor = schedule.payPeriodAnchor
        ? stripTime(schedule.payPeriodAnchor)
        : startOfWeek(date);
      const daysSince = diffDays(anchor, stripTime(date));
      const periodIndex = Math.floor(daysSince / 14);
      const start = addDays(anchor, periodIndex * 14);
      const end = addDays(start, 13);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "WEEKLY":
    default: {
      const start = startOfWeek(date);
      return { start, end: endOfWeek(start) };
    }
  }
}

export function shiftPayPeriod(
  currentStart: Date,
  schedule: PaySchedule,
  direction: -1 | 1,
): Date {
  switch (schedule.payPeriodType) {
    case "MONTHLY": {
      const d = new Date(currentStart);
      d.setMonth(d.getMonth() + direction);
      return startOfMonth(d);
    }
    case "FORTNIGHTLY":
      return addDays(currentStart, direction * 14);
    case "WEEKLY":
    default:
      return addWeeks(currentStart, direction);
  }
}

export function formatPayPeriodLabel(
  start: Date,
  end: Date,
  type: PayPeriodType,
): string {
  if (type === "MONTHLY") {
    return start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const year =
    start.getFullYear() !== end.getFullYear() ? ` ${start.getFullYear()}` : "";
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}${year}`;
}

export function getPayPeriodTypeLabel(type: PayPeriodType): string {
  switch (type) {
    case "FORTNIGHTLY":
      return "Every 2 weeks";
    case "MONTHLY":
      return "Monthly";
    default:
      return "Weekly";
  }
}

export function getPaydayDescription(schedule: PaySchedule): string {
  switch (schedule.payPeriodType) {
    case "MONTHLY":
      if (schedule.paydayMode === "LAST_WEEKDAY_OF_MONTH") {
        return `Paid on the last ${WEEKDAY_NAMES[schedule.paydayOfWeek]} of each month`;
      }
      if (schedule.paydayOfMonth > 28) {
        return `Paid on the ${ordinal(schedule.paydayOfMonth)} of each month (or the last day in shorter months)`;
      }
      return `Paid on the ${ordinal(schedule.paydayOfMonth)} of each month`;
    case "FORTNIGHTLY":
      return schedule.payPeriodAnchor
        ? `Fortnight cycle from ${formatShortDate(schedule.payPeriodAnchor)}`
        : "Fortnightly pay period";
    default:
      return `Paid on ${WEEKDAY_NAMES[schedule.paydayOfWeek]}s`;
  }
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const last = day % 10;
  if (last === 1) return `${day}st`;
  if (last === 2) return `${day}nd`;
  if (last === 3) return `${day}rd`;
  return `${day}th`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function defaultEntryDateForRange(start: Date, end: Date, today = new Date()): string {
  const t = stripTime(today);
  if (isDateInRange(t, start, end)) {
    return toDateInputValue(t);
  }
  return toDateInputValue(start);
}

/** Full Mon–Sun bounds for logging in week view, including future days in that week. */
export function buildEntryDateRangeForWeek(
  weekStart: Date,
  weekEnd: Date,
  today = new Date(),
): { min: string; max: string; default: string } {
  return {
    min: toDateInputValue(weekStart),
    max: toDateInputValue(weekEnd),
    default: defaultEntryDateForRange(weekStart, weekEnd, today),
  };
}

/** Bounds for logging from pay period view; entries are stored on the week of each date. */
export function buildEntryDateRangeForPayPeriod(
  payStart: Date,
  payEnd: Date,
  today = new Date(),
): { min: string; max: string; default: string } {
  return {
    min: toDateInputValue(payStart),
    max: toDateInputValue(payEnd),
    default: defaultEntryDateForRange(payStart, payEnd, today),
  };
}

export function parseViewParam(
  view: string | undefined,
  schedule?: PaySchedule,
): "week" | "pay" {
  if (view === "pay") return "pay";
  if (view === "week") return "week";
  return schedule?.payPeriodType && schedule.payPeriodType !== "WEEKLY"
    ? "pay"
    : "week";
}

export function usesExtendedPayPeriod(schedule: PaySchedule): boolean {
  return schedule.payPeriodType !== "WEEKLY";
}

export function getDefaultPayViewAnchor(today: Date, schedule: PaySchedule): Date {
  return getDefaultSubmissionAnchor(today, schedule);
}

export { getSubmissionTimingDescription };

export function parsePayPeriodParam(value?: string): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  return parseDateInput(value);
}
