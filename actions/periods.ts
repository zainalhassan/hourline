"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWeeks, startOfWeek } from "@/lib/timesheet/periods";
import { requirePeriod, markPeriodReady, reopenPeriod } from "@/lib/timesheet/periodQueries";

export type PeriodActionState = {
  error?: string;
  success?: boolean;
};

export async function preparePeriodAction(
  periodId: string,
  _prev: PeriodActionState,
  _formData: FormData,
): Promise<PeriodActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const result = await markPeriodReady(periodId, session.user.id);
  if (result.error) return { error: result.error };

  revalidatePath("/");
  return { success: true };
}

export async function reopenPeriodAction(
  periodId: string,
): Promise<PeriodActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await reopenPeriod(periodId, session.user.id);
  revalidatePath("/");
  return { success: true };
}

export async function duplicatePreviousWeekAction(
  periodId: string,
): Promise<PeriodActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const period = await requirePeriod(periodId, session.user.id);
  if (period.status === "SENT") {
    return { error: "This timesheet has been sent and cannot be edited" };
  }

  const prevStart = addWeeks(startOfWeek(period.startDate), -1);
  const prevPeriod = await prisma.timesheetPeriod.findUnique({
    where: {
      userId_startDate: {
        userId: session.user.id,
        startDate: prevStart,
      },
    },
    include: { entries: true },
  });

  if (!prevPeriod || prevPeriod.entries.length === 0) {
    return { error: "No entries in the previous week to copy" };
  }

  await prisma.$transaction([
    prisma.timeEntry.deleteMany({ where: { periodId: period.id } }),
    prisma.timeEntry.createMany({
      data: prevPeriod.entries.map((entry) => ({
        periodId: period.id,
        entryDate: addWeeks(entry.entryDate, 1),
        durationMinutes: entry.durationMinutes,
        mileage: entry.mileage,
        metadata: entry.metadata ?? {},
      })),
    }),
    prisma.timesheetPeriod.update({
      where: { id: period.id },
      data: { status: "DRAFT" },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}
