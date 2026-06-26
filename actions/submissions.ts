"use server";

import { revalidatePath } from "next/cache";
import { PeriodStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppDisplayName, isEmailConfigured } from "@/lib/env";
import { sendTimesheetEmail } from "@/lib/email/sendTimesheet";
import { generateTimesheetPdf } from "@/lib/pdf/generateTimesheetPdf";
import { requirePeriod } from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { getMileageFromEntry, normalizeFieldConfig } from "@/lib/timesheet/fieldConfig";
import { sendTimesheetSchema } from "@/lib/validations";

export type SubmissionActionState = {
  error?: string;
  success?: boolean;
};

export async function sendTimesheetToEmployer(
  _prev: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = sendTimesheetSchema.safeParse({
    periodId: formData.get("periodId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  if (!user.employerEmail) {
    return { error: "Add an employer email in Settings before sending" };
  }

  const period = await requirePeriod(parsed.data.periodId, session.user.id);

  if (period.status === PeriodStatus.DRAFT) {
    return { error: "Mark this timesheet as ready before sending" };
  }

  if (period.entries.length === 0) {
    return { error: "No entries to send" };
  }

  const activeTemplate = await getUserActiveTemplate(session.user.id);
  const fieldConfig = period.fieldConfigSnapshot
    ? normalizeFieldConfig(period.fieldConfigSnapshot)
    : activeTemplate.fieldConfig;

  const pdfBuffer = await generateTimesheetPdf({
    userName: user.name ?? user.email,
    userEmail: user.email,
    periodStart: period.startDate,
    periodEnd: period.endDate,
    templateName: activeTemplate.name,
    fieldConfig,
    entries: period.entries.map((e) => ({
      entryDate: e.entryDate,
      durationMinutes: e.durationMinutes,
      mileage: getMileageFromEntry(e),
      metadata: (e.metadata as Record<string, unknown>) ?? {},
    })),
  });

  const message =
    parsed.data.message?.trim() ||
    user.submitMessage?.trim() ||
    `Please find my timesheet attached.`;

  if (!isEmailConfigured()) {
    return {
      error:
        "Email is not configured on this server. Download the PDF instead, or configure SMTP settings.",
    };
  }

  await sendTimesheetEmail({
    to: user.employerEmail,
    toName: user.employerName ?? undefined,
    cc: user.ccSelfOnSubmit ? user.email : undefined,
    subject: `${getAppDisplayName()} timesheet — ${user.name ?? user.email}`,
    message,
    pdfBuffer,
    periodLabel: `${period.startDate.toISOString().slice(0, 10)} to ${period.endDate.toISOString().slice(0, 10)}`,
  });

  await prisma.$transaction([
    prisma.submission.create({
      data: {
        periodId: period.id,
        recipientEmail: user.employerEmail,
        recipientName: user.employerName,
        ccEmail: user.ccSelfOnSubmit ? user.email : null,
        message,
      },
    }),
    prisma.timesheetPeriod.update({
      where: { id: period.id },
      data: { status: PeriodStatus.SENT },
    }),
  ]);

  revalidatePath("/");
  return { success: true };
}
