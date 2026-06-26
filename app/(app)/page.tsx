import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/user";
import { isEmailConfigured } from "@/lib/env";
import {
  getAdjacentWeeks,
  getOrCreatePeriod,
  parseWeekParam,
} from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { getVisibleResolvedFields, normalizeFieldConfig } from "@/lib/timesheet/fieldConfig";
import {
  formatDuration,
  formatWeekLabel,
  toDateInputValue,
} from "@/lib/timesheet/periods";
import { EntriesTable } from "@/components/timesheet/EntriesTable";
import { EntryForm } from "@/components/timesheet/EntryForm";
import { QuickAddSheet } from "@/components/timesheet/QuickAddSheet";
import { SubmissionPanel } from "@/components/timesheet/SubmissionPanel";
import { TodayHero } from "@/components/timesheet/TodayHero";
import { WeekSelector } from "@/components/timesheet/WeekSelector";
import { SectionCard } from "@/components/transit/SectionCard";
import type { StoredFieldConfig } from "@/lib/timesheet/fieldConfig";

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
  const activeTemplate = await getUserActiveTemplate(session.user.id);

  const fieldConfig: StoredFieldConfig = period.fieldConfigSnapshot
    ? normalizeFieldConfig(period.fieldConfigSnapshot)
    : activeTemplate.fieldConfig;

  const template = {
    ...activeTemplate,
    fieldConfig,
    fields: getVisibleResolvedFields(fieldConfig),
  };

  const { prev, next } = getAdjacentWeeks(period.startDate);
  const totalMinutes = period.entries.reduce((s, e) => s + e.durationMinutes, 0);
  const canEdit = period.status !== "SENT";
  const lastEntry =
    period.entries.length > 0
      ? period.entries[period.entries.length - 1]
      : null;

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24 lg:space-y-6 lg:pb-8">
      <TodayHero
        todayLabel={todayLabel}
        weekLabel={formatWeekLabel(period.startDate, period.endDate)}
        totalMinutes={totalMinutes}
        entryCount={period.entries.length}
        templateName={template.name}
        status={period.status}
      />

      <WeekSelector
        weekStart={toDateInputValue(period.startDate)}
        prevWeek={toDateInputValue(prev)}
        nextWeek={toDateInputValue(next)}
      />

      <SubmissionPanel
        periodId={period.id}
        status={period.status}
        hasEmployerEmail={Boolean(user?.employerEmail)}
        emailConfigured={isEmailConfigured()}
        entryCount={period.entries.length}
        submissions={period.submissions.map((s) => ({
          id: s.id,
          sentAt: s.sentAt,
          recipientEmail: s.recipientEmail,
        }))}
      />

      <SectionCard
        title="This week"
        description={`${period.entries.length} entries · ${formatDuration(totalMinutes)}`}
        headerColor="var(--color-route-cyan)"
      >
        <EntriesTable
          entries={period.entries}
          fieldConfig={fieldConfig}
          periodId={period.id}
          canEdit={canEdit}
        />
      </SectionCard>

      {canEdit && (
        <div className="hidden lg:block">
          <SectionCard
            title="Add entry"
            description="Full form with all fields."
            headerColor={template.headerColor}
          >
            <EntryForm
              periodId={period.id}
              fields={template.fields}
              lastEntry={lastEntry}
            />
          </SectionCard>
        </div>
      )}

      <QuickAddSheet
        periodId={period.id}
        fields={template.fields}
        lastEntry={lastEntry}
        canEdit={canEdit}
      />

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
