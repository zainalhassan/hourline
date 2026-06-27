import type { PaydayMode } from "@prisma/client";

export const PAY_SCHEDULE_WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
] as const;

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const last = day % 10;
  if (last === 1) return `${day}st`;
  if (last === 2) return `${day}nd`;
  if (last === 3) return `${day}rd`;
  return `${day}th`;
}

export const MONTHLY_PAYDAY_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const suffix = day > 28 ? " (or last day in shorter months)" : "";
    return {
      value: `day:${day}`,
      label: `${ordinal(day)} of the month${suffix}`,
    };
  }),
  ...PAY_SCHEDULE_WEEKDAYS.map((day) => ({
    value: `last:${day.value}`,
    label: `Last ${day.label} of the month`,
  })),
];

export function monthlyPaydayValue(
  mode: PaydayMode,
  dayOfMonth: number,
  dayOfWeek: number,
): string {
  if (mode === "LAST_WEEKDAY_OF_MONTH") {
    return `last:${dayOfWeek}`;
  }
  return `day:${dayOfMonth}`;
}

export function parseMonthlyPayday(value: string): {
  paydayMode: PaydayMode;
  paydayOfMonth: number;
  paydayOfWeek: number;
} {
  if (value.startsWith("last:")) {
    return {
      paydayMode: "LAST_WEEKDAY_OF_MONTH",
      paydayOfMonth: 28,
      paydayOfWeek: Number(value.slice(5)),
    };
  }
  return {
    paydayMode: "DAY_OF_MONTH",
    paydayOfMonth: Number(value.slice(4)),
    paydayOfWeek: 5,
  };
}
