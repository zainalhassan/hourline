"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  updatePayScheduleSchema,
  updateSettingsSchema,
  updateSubmissionSettingsSchema,
} from "@/lib/validations";
import { parseDateInput } from "@/lib/timesheet/periods";
import { resolvePayTimingPersistence } from "@/lib/timesheet/payTiming";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
};

export async function updateUserSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = updateSettingsSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateSubmissionSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = updateSubmissionSettingsSchema.safeParse({
    employerName: formData.get("employerName"),
    employerEmail: formData.get("employerEmail"),
    ccSelfOnSubmit: formData.get("ccSelfOnSubmit") === "on",
    submitMessage: formData.get("submitMessage"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      employerName: parsed.data.employerName || null,
      employerEmail: parsed.data.employerEmail || null,
      ccSelfOnSubmit: parsed.data.ccSelfOnSubmit ?? false,
      submitMessage: parsed.data.submitMessage || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePaySchedule(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = updatePayScheduleSchema.safeParse({
    payPeriodType: formData.get("payPeriodType"),
    paydayMode: formData.get("paydayMode"),
    paydayOfWeek: formData.get("paydayOfWeek"),
    paydayOfMonth: formData.get("paydayOfMonth"),
    payPeriodAnchor: formData.get("payPeriodAnchor"),
    payTimingMode: formData.get("payTimingMode"),
    periodCloseMode: formData.get("periodCloseMode"),
    periodCloseDayOfMonth: formData.get("periodCloseDayOfMonth"),
    periodCloseDaysBeforePayday: formData.get("periodCloseDaysBeforePayday"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const payTiming = resolvePayTimingPersistence(parsed.data.payPeriodType, {
    payTimingMode: parsed.data.payTimingMode,
    periodCloseMode: parsed.data.periodCloseMode,
    periodCloseDayOfMonth: parsed.data.periodCloseDayOfMonth,
    periodCloseDaysBeforePayday: parsed.data.periodCloseDaysBeforePayday,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      payPeriodType: parsed.data.payPeriodType,
      paydayMode: parsed.data.paydayMode,
      paydayOfWeek: parsed.data.paydayOfWeek,
      paydayOfMonth: parsed.data.paydayOfMonth,
      payPeriodAnchor: parsed.data.payPeriodAnchor
        ? parseDateInput(parsed.data.payPeriodAnchor)
        : null,
      ...payTiming,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function changePassword(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "Password change is not available for this account" };
  }

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true };
}
