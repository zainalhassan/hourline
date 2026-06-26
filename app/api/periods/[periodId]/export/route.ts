import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePeriod } from "@/lib/timesheet/periodQueries";
import { buildTimesheetCsv } from "@/lib/timesheet/exportCsv";

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

  const csv = buildTimesheetCsv(period.fieldConfigSnapshot, period.entries);
  const label = `${period.startDate.toISOString().slice(0, 10)}_timesheet.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${label}"`,
    },
  });
}
