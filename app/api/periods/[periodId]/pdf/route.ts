import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppDisplayName } from "@/lib/env";
import { generateTimesheetPdf } from "@/lib/pdf/generateTimesheetPdf";
import { requirePeriod } from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { getMileageFromEntry, normalizeFieldConfig } from "@/lib/timesheet/fieldConfig";

type RouteContext = {
  params: Promise<{ periodId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { periodId } = await context.params;
  const period = await requirePeriod(periodId, session.user.id);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

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

  const filename = `hourline-timesheet-${period.startDate.toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "X-Generated-By": getAppDisplayName(),
    },
  });
}
