"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDurationInput } from "@/lib/timesheet/periods";
import { requirePeriod } from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate, getVisibleFields } from "@/lib/timesheet/templates";
import type { EntryMetadata } from "@/lib/timesheet/fields";
import { createEntrySchema, updateEntrySchema } from "@/lib/validations";

export type EntryActionState = {
  error?: string;
  success?: boolean;
};

function buildMetadata(formData: FormData): EntryMetadata {
  return {
    client: String(formData.get("client") ?? "").trim() || undefined,
    project: String(formData.get("project") ?? "").trim() || undefined,
    taskDescription: String(formData.get("taskDescription") ?? "").trim() || undefined,
    mileageDescription: String(formData.get("mileageDescription") ?? "").trim() || undefined,
    location: String(formData.get("location") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    billable: formData.get("billable") === "on" || formData.get("billable") === "true",
  };
}

async function validateRequiredFields(
  userId: string,
  formData: FormData,
  durationMinutes: number,
) {
  const template = await getUserActiveTemplate(userId);
  const visible = getVisibleFields(template.fields);

  for (const field of visible) {
    if (!field.required) continue;
    if (field.fieldKey === "durationMinutes" && durationMinutes <= 0) {
      return `Duration is required`;
    }
    if (field.fieldKey === "mileage") continue;
    if (field.fieldKey === "billable") continue;
    const value = String(formData.get(field.fieldKey) ?? "").trim();
    if (!value) {
      return `${field.fieldKey} is required`;
    }
  }
  return null;
}

export async function createTimeEntry(
  periodId: string,
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const period = await requirePeriod(periodId, session.user.id);
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

  const requiredError = await validateRequiredFields(
    session.user.id,
    formData,
    totalMinutes,
  );
  if (requiredError) return { error: requiredError };

  await prisma.timeEntry.create({
    data: {
      periodId,
      entryDate: new Date(parsed.data.entryDate),
      durationMinutes: totalMinutes,
      mileage: parsed.data.mileage ?? null,
      metadata: buildMetadata(formData),
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

  const requiredError = await validateRequiredFields(
    session.user.id,
    formData,
    totalMinutes,
  );
  if (requiredError) return { error: requiredError };

  await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      entryDate: new Date(parsed.data.entryDate),
      durationMinutes: totalMinutes,
      mileage: parsed.data.mileage ?? null,
      metadata: buildMetadata(formData),
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
