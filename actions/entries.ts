"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDurationInput } from "@/lib/timesheet/periods";
import { requirePeriod } from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import {
  parseEntryFromForm,
  resolvePeriodFieldConfig,
  validateEntryRequiredFields,
} from "@/lib/timesheet/entryForm";
import { createEntrySchema, updateEntrySchema } from "@/lib/validations";

export type EntryActionState = {
  error?: string;
  success?: boolean;
};

async function getPeriodFieldConfig(periodId: string, userId: string) {
  const period = await requirePeriod(periodId, userId);
  const template = await getUserActiveTemplate(userId);
  return {
    period,
    fieldConfig: resolvePeriodFieldConfig(
      period.fieldConfigSnapshot,
      template.fieldConfig,
    ),
  };
}

export async function createTimeEntry(
  periodId: string,
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { period, fieldConfig } = await getPeriodFieldConfig(
    periodId,
    session.user.id,
  );
  if (period.status === "SENT") {
    return { error: "This timesheet has been sent and cannot be edited" };
  }

  const parsed = createEntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    durationHours: formData.get("durationHours"),
    durationMinutes: formData.get("durationMinutes"),
    mileage: formData.get("mileage") || undefined,
    client: formData.get("client"),
    project: formData.get("project"),
    taskDescription: formData.get("taskDescription"),
    mileageDescription: formData.get("mileageDescription"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    billable: formData.get("billable"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const totalMinutes = parseDurationInput(
    String(parsed.data.durationHours),
    String(parsed.data.durationMinutes),
  );

  const requiredError = validateEntryRequiredFields(
    formData,
    fieldConfig,
    totalMinutes,
  );
  if (requiredError) return { error: requiredError };

  const { metadata, mileage } = parseEntryFromForm(formData, fieldConfig);

  await prisma.timeEntry.create({
    data: {
      periodId,
      entryDate: new Date(parsed.data.entryDate),
      durationMinutes: totalMinutes,
      mileage,
      metadata: metadata as object,
    },
  });

  if (period.status === "READY") {
    await prisma.timesheetPeriod.update({
      where: { id: periodId },
      data: { status: "DRAFT" },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateTimeEntry(
  entryId: string,
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, period: { userId: session.user.id } },
    include: { period: true },
  });
  if (!entry) return { error: "Entry not found" };
  if (entry.period.status === "SENT") {
    return { error: "This timesheet has been sent and cannot be edited" };
  }

  const template = await getUserActiveTemplate(session.user.id);
  const fieldConfig = resolvePeriodFieldConfig(
    entry.period.fieldConfigSnapshot,
    template.fieldConfig,
  );

  const parsed = updateEntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    durationHours: formData.get("durationHours"),
    durationMinutes: formData.get("durationMinutes"),
    mileage: formData.get("mileage") || undefined,
    client: formData.get("client"),
    project: formData.get("project"),
    taskDescription: formData.get("taskDescription"),
    mileageDescription: formData.get("mileageDescription"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    billable: formData.get("billable"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const totalMinutes = parseDurationInput(
    String(parsed.data.durationHours),
    String(parsed.data.durationMinutes),
  );

  const requiredError = validateEntryRequiredFields(
    formData,
    fieldConfig,
    totalMinutes,
  );
  if (requiredError) return { error: requiredError };

  const { metadata, mileage } = parseEntryFromForm(formData, fieldConfig);

  await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      entryDate: new Date(parsed.data.entryDate),
      durationMinutes: totalMinutes,
      mileage,
      metadata: metadata as object,
    },
  });

  if (entry.period.status === "READY") {
    await prisma.timesheetPeriod.update({
      where: { id: entry.periodId },
      data: { status: "DRAFT" },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteTimeEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, period: { userId: session.user.id } },
    include: { period: true },
  });
  if (!entry) return { error: "Entry not found" };
  if (entry.period.status === "SENT") {
    return { error: "This timesheet has been sent and cannot be edited" };
  }

  await prisma.timeEntry.delete({ where: { id: entryId } });
  revalidatePath("/");
  return { success: true };
}

export async function duplicateEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, period: { userId: session.user.id } },
    include: { period: true },
  });
  if (!entry) return { error: "Entry not found" };
  if (entry.period.status === "SENT") {
    return { error: "This timesheet has been sent and cannot be edited" };
  }

  await prisma.timeEntry.create({
    data: {
      periodId: entry.periodId,
      entryDate: entry.entryDate,
      durationMinutes: entry.durationMinutes,
      mileage: entry.mileage,
      metadata: entry.metadata ?? {},
    },
  });

  if (entry.period.status === "READY") {
    await prisma.timesheetPeriod.update({
      where: { id: entry.periodId },
      data: { status: "DRAFT" },
    });
  }

  revalidatePath("/");
  return { success: true };
}
