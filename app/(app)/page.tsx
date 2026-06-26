import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/user";
import {
  getAdjacentWeeks,
  getOrCreatePeriod,
  parseWeekParam,
} from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { formatDuration, toDateInputValue } from "@/lib/timesheet/periods";
import { EntriesTable } from "@/components/timesheet/EntriesTable";
import { EntryForm } from "@/components/timesheet/EntryForm";
import { PeriodActions } from "@/components/timesheet/PeriodActions";
import { WeekSelector } from "@/components/timesheet/WeekSelector";
import { PageHeader } from "@/components/transit/PageHeader";
import { SectionCard } from "@/components/transit/SectionCard";
import { StatCard } from "@/components/transit/StatCard";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";

type HomeProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const weekDate = parseWeekParam(params.week);
  const period = await getOrCreatePeriod(session.user.id, weekDate);
  const user = await getUserById(session.user.id);
  const template = period.fieldConfigSnapshot
    ? {
        ...(await getUserActiveTemplate(session.user.id)),
        fields: period.fieldConfigSnapshot as TemplateFieldConfig[],
      }
    : await getUserActiveTemplate(session.user.id);

  const { prev, next } = getAdjacentWeeks(period.startDate);
  const totalMinutes = period.entries.reduce((s, e) => s + e.durationMinutes, 0);
  const totalMileage = period.entries.reduce(
    (s, e) => s + (e.mileage ? Number(e.mileage) : 0),
    0,
  );
  const canEdit = period.status !== "SENT";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Timesheet"
        description={`${template.name} · ${period.status.toLowerCase()}`}
      />

      <WeekSelector
        weekStart={toDateInputValue(period.startDate)}
        prevWeek={toDateInputValue(prev)}
        nextWeek={toDateInputValue(next)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total hours"
          value={formatDuration(totalMinutes)}
          headerColor="var(--color-route-blue)"
        />
        <StatCard
          label="Entries"
          value={String(period.entries.length)}
          headerColor="var(--color-route-green)"
        />
        {totalMileage > 0 && (
          <StatCard
            label="Mileage"
            value={`${totalMileage.toFixed(1)} mi`}
            headerColor="var(--color-route-orange)"
          />
        )}
      </div>

      <SectionCard
        title="Actions"
        description="Prepare, preview, or send this week's timesheet."
        headerColor="var(--color-route-purple)"
      >
        <PeriodActions
          periodId={period.id}
          status={period.status}
          hasEmployerEmail={Boolean(user?.employerEmail)}
          entryCount={period.entries.length}
        />
        {period.submissions.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Submission history</p>
            <ul className="mt-1 space-y-1">
              {period.submissions.map((s) => (
                <li key={s.id}>
                  Sent to {s.recipientEmail} on{" "}
                  {s.sentAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {canEdit && (
          <SectionCard
            title="Add entry"
            description="Log time for this week."
            headerColor={template.headerColor}
          >
            <EntryForm periodId={period.id} fields={template.fields} />
          </SectionCard>
        )}

        <SectionCard
          title="This week"
          description={`${period.entries.length} entries`}
          headerColor="var(--color-route-cyan)"
          className={canEdit ? "" : "lg:col-span-2"}
        >
          <EntriesTable
            entries={period.entries}
            fields={template.fields}
            periodId={period.id}
            canEdit={canEdit}
          />
        </SectionCard>
      </div>

      {!user?.employerEmail && (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/settings" className="font-medium text-primary hover:underline">
            Add your employer email
          </Link>{" "}
          to send timesheets when ready.
        </p>
      )}
    </div>
  );
}
