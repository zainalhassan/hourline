import { PeriodStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { resolvePeriodFieldConfig } from "@/lib/timesheet/fieldConfig";
import { validatePeriodEntries } from "@/lib/timesheet/periodValidation";
import {
  addWeeks,
  endOfWeek,
  parseDateInput,
  startOfWeek,
} from "@/lib/timesheet/periods";
import { isDateInRange } from "@/lib/timesheet/payPeriod";
import type { PaySchedule } from "@/lib/timesheet/payPeriod";
import { getSubmissionDateRange } from "@/lib/timesheet/submissionScope";

async function findOrCreatePeriodRecord(userId: string, start: Date, end: Date) {
  const existing = await prisma.timesheetPeriod.findUnique({
    where: {
      userId_startDate: { userId, startDate: start },
    },
    include: {
      entries: { orderBy: { entryDate: "asc" } },
      submissions: { orderBy: { sentAt: "desc" } },
    },
  });

  if (existing) return existing;

  const template = await getUserActiveTemplate(userId);

  return prisma.timesheetPeriod.create({
    data: {
      userId,
      startDate: start,
      endDate: end,
      presetUsed: template.preset,
      userTemplateId: template.userTemplateId,
      fieldConfigSnapshot: template.fieldConfig,
    },
    include: {
      entries: { orderBy: { entryDate: "asc" } },
      submissions: { orderBy: { sentAt: "desc" } },
    },
  });
}

export async function getOrCreatePeriod(userId: string, weekStart?: Date) {
  const start = weekStart ? startOfWeek(weekStart) : startOfWeek(new Date());
  const end = endOfWeek(start);
  return findOrCreatePeriodRecord(userId, start, end);
}

export async function getOrCreateSubmissionPeriod(
  userId: string,
  schedule: PaySchedule,
  anchor: Date = new Date(),
) {
  const { start, end } = getSubmissionDateRange(anchor, schedule);
  return findOrCreatePeriodRecord(userId, start, end);
}

export async function loadPeriodScopedEntries(periodId: string, userId: string) {
  const period = await requirePeriod(periodId, userId);
  const entries = await getEntriesForDateRange(
    userId,
    period.startDate,
    period.endDate,
  );
  return { period, entries };
}

export async function requirePeriod(periodId: string, userId: string) {
  const period = await prisma.timesheetPeriod.findFirst({
    where: { id: periodId, userId },
    include: {
      entries: { orderBy: { entryDate: "asc" } },
      submissions: { orderBy: { sentAt: "desc" } },
    },
  });
  if (!period) throw new Error("Period not found");
  return period;
}

export async function markPeriodReady(periodId: string, userId: string) {
  const { period, entries } = await loadPeriodScopedEntries(periodId, userId);
  const template = await getUserActiveTemplate(userId);
  const fieldConfig = resolvePeriodFieldConfig(
    period.fieldConfigSnapshot,
    template.fieldConfig,
    period.status,
  );

  const validationError = validatePeriodEntries(entries, fieldConfig);
  if (validationError) {
    return { error: validationError };
  }

  await prisma.timesheetPeriod.update({
    where: { id: periodId },
    data: { status: PeriodStatus.READY },
  });
  return { success: true };
}

export async function reopenPeriod(periodId: string, userId: string) {
  await requirePeriod(periodId, userId);
  await prisma.timesheetPeriod.update({
    where: { id: periodId },
    data: { status: PeriodStatus.DRAFT },
  });
}

export function parseWeekParam(week?: string): Date {
  if (!week) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return new Date();
  return parseDateInput(week);
}

export function filterEntriesInRange<T extends { entryDate: Date }>(
  entries: T[],
  start: Date,
  end: Date,
): T[] {
  return entries.filter((entry) =>
    isDateInRange(new Date(entry.entryDate), start, end),
  );
}

export async function getEntriesForDateRange(
  userId: string,
  start: Date,
  end: Date,
) {
  return prisma.timeEntry.findMany({
    where: {
      period: { userId },
      entryDate: { gte: start, lte: end },
    },
    include: { period: true },
    orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
  });
}

export function getAdjacentWeeks(currentStart: Date) {
  return {
    prev: addWeeks(currentStart, -1),
    next: addWeeks(currentStart, 1),
  };
}
