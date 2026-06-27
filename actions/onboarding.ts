"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/timesheet/periods";
import { resolvePayTimingPersistence } from "@/lib/timesheet/payTiming";
import { completeOnboardingSchema } from "@/lib/validations";

export type OnboardingActionState = {
  error?: string;
};

export async function completeOnboarding(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = completeOnboardingSchema.safeParse({
    name: formData.get("name"),
    preset: formData.get("preset"),
    payPeriodType: formData.get("payPeriodType"),
    paydayMode: formData.get("paydayMode"),
    paydayOfWeek: formData.get("paydayOfWeek"),
    paydayOfMonth: formData.get("paydayOfMonth"),
    payPeriodAnchor: formData.get("payPeriodAnchor"),
    payTimingMode: formData.get("payTimingMode"),
    periodCloseMode: formData.get("periodCloseMode"),
    periodCloseDayOfMonth: formData.get("periodCloseDayOfMonth"),
    periodCloseDaysBeforePayday: formData.get("periodCloseDaysBeforePayday"),
    employerName: formData.get("employerName"),
    employerEmail: formData.get("employerEmail"),
    ccSelfOnSubmit: formData.get("ccSelfOnSubmit"),
    submitMessage: formData.get("submitMessage"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const employerEmail = parsed.data.employerEmail?.trim() || null;
  const employerName = parsed.data.employerName?.trim() || null;
  const submitMessage = parsed.data.submitMessage?.trim() || null;
  const payTiming = resolvePayTimingPersistence(parsed.data.payPeriodType, {
    payTimingMode: parsed.data.payTimingMode,
    periodCloseMode: parsed.data.periodCloseMode,
    periodCloseDayOfMonth: parsed.data.periodCloseDayOfMonth,
    periodCloseDaysBeforePayday: parsed.data.periodCloseDaysBeforePayday,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name.trim(),
      activePreset: parsed.data.preset,
      activeUserTemplateId: null,
      payPeriodType: parsed.data.payPeriodType,
      paydayMode: parsed.data.paydayMode,
      paydayOfWeek: parsed.data.paydayOfWeek,
      paydayOfMonth: parsed.data.paydayOfMonth,
      payPeriodAnchor: parsed.data.payPeriodAnchor
        ? parseDateInput(parsed.data.payPeriodAnchor)
        : null,
      ...payTiming,
      employerName,
      employerEmail,
      ccSelfOnSubmit: parsed.data.ccSelfOnSubmit ?? false,
      submitMessage,
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/");
}
