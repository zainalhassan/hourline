import { PeriodStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { validatePeriodEntries } from "@/lib/timesheet/periodValidation";
import {
  addWeeks,
  endOfWeek,
  startOfWeek,
} from "@/lib/timesheet/periods";

export async function getOrCreatePeriod(userId: string, weekStart?: Date) {
  const start = weekStart ? startOfWeek(weekStart) : startOfWeek(new Date());
  const end = endOfWeek(start);

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
  const period = await requirePeriod(periodId, userId);
  const template = await getUserActiveTemplate(userId);
  const fieldConfig =
    period.fieldConfigSnapshot ?? template.fieldConfig;

  const validationError = validatePeriodEntries(period.entries, fieldConfig);
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
  const parsed = new Date(week);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

export function getAdjacentWeeks(currentStart: Date) {
  return {
    prev: addWeeks(currentStart, -1),
    next: addWeeks(currentStart, 1),
  };
}
