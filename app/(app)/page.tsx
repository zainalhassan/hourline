import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/user";
import { isEmailConfigured } from "@/lib/env";
import {
  filterEntriesInRange,
  getAdjacentWeeks,
  getEntriesForDateRange,
  getOrCreatePeriod,
  parseWeekParam,
} from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { getVisibleResolvedFields, normalizeFieldConfig } from "@/lib/timesheet/fieldConfig";
import { normalizeDurationPresets } from "@/lib/timesheet/durationPresets";
import {
  defaultEntryDateForRange,
  formatPayPeriodLabel,
  getPayPeriodContaining,
  getPaydayDescription,
  getPayPeriodTypeLabel,
  normalizePaySchedule,
  parsePayPeriodParam,
  parseViewParam,
  shiftPayPeriod,
  usesExtendedPayPeriod,
} from "@/lib/timesheet/payPeriod";
import {
  formatDuration,
  formatWeekLabel,
  parseDateInput,
  toDateInputValue,
} from "@/lib/timesheet/periods";
import { EntriesTable } from "@/components/timesheet/EntriesTable";
import { EntryForm } from "@/components/timesheet/EntryForm";
import { QuickAddSheet } from "@/components/timesheet/QuickAddSheet";
import { PeriodNavigator } from "@/components/timesheet/PeriodNavigator";
import { SubmissionPanel } from "@/components/timesheet/SubmissionPanel";
import { TimesheetViewTabs } from "@/components/timesheet/TimesheetViewTabs";
import { TodayHero } from "@/components/timesheet/TodayHero";
import { SectionCard } from "@/components/transit/SectionCard";
import type { StoredFieldConfig } from "@/lib/timesheet/fieldConfig";

type HomeProps = {
  searchParams: Promise<{ week?: string; pay?: string; view?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const user = await getUserById(session.user.id);
  if (!user) redirect("/login");

  const schedule = normalizePaySchedule(user);
  const view = parseViewParam(params.view, schedule);
  const activeTemplate = await getUserActiveTemplate(session.user.id);
  const durationPresets = normalizeDurationPresets(user.durationPresets);
  const extendedPayPeriod = usesExtendedPayPeriod(schedule);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (view === "pay") {
    const payAnchor = parsePayPeriodParam(params.pay);
    const payPeriod = getPayPeriodContaining(payAnchor, schedule);
    const payStartKey = toDateInputValue(payPeriod.start);
    const prevPayStart = shiftPayPeriod(payPeriod.start, schedule, -1);
    const nextPayStart = shiftPayPeriod(payPeriod.start, schedule, 1);

    const payEntries = await getEntriesForDateRange(
      session.user.id,
      payPeriod.start,
      payPeriod.end,
    );
    const totalMinutes = payEntries.reduce((s, e) => s + e.durationMinutes, 0);
    const dateRange = {
      min: payStartKey,
      max: toDateInputValue(payPeriod.end),
      default: defaultEntryDateForRange(payPeriod.start, payPeriod.end, today),
    };
    const logPeriod = await getOrCreatePeriod(
      session.user.id,
      parseDateInput(dateRange.default),
    );
    const canLog = logPeriod.status !== "SENT";
    const fieldConfig: StoredFieldConfig = logPeriod.fieldConfigSnapshot
      ? normalizeFieldConfig(logPeriod.fieldConfigSnapshot)
      : activeTemplate.fieldConfig;
    const template = {
      ...activeTemplate,
      fieldConfig,
      fields: getVisibleResolvedFields(fieldConfig),
    };
    const lastEntry = payEntries.length > 0 ? payEntries[payEntries.length - 1] : null;

    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-24 lg:space-y-6 lg:pb-8">
        <TodayHero
          todayLabel={todayLabel}
          scopeTitle={formatPayPeriodLabel(
            payPeriod.start,
            payPeriod.end,
            schedule.payPeriodType,
          )}
          scopeSubtitle={`${getPayPeriodTypeLabel(schedule.payPeriodType)} timesheet`}
          totalMinutes={totalMinutes}
          entryCount={payEntries.length}
          templateName={template.name}
          status="overview"
          paydayHint={getPaydayDescription(schedule)}
        />

        {extendedPayPeriod ? null : (
          <TimesheetViewTabs
            activeView="pay"
            weekStart={toDateInputValue(
              (await getOrCreatePeriod(session.user.id, today)).startDate,
            )}
            payStart={payStartKey}
          />
        )}

        <PeriodNavigator
          label={formatPayPeriodLabel(
            payPeriod.start,
            payPeriod.end,
            schedule.payPeriodType,
          )}
          prevHref={`/?pay=${toDateInputValue(prevPayStart)}&view=pay`}
          nextHref={`/?pay=${toDateInputValue(nextPayStart)}&view=pay`}
          prevLabel="Previous pay period"
          nextLabel="Next pay period"
        />

        <SectionCard
          title="Pay period"
          description={`${payEntries.length} entries · ${formatDuration(totalMinutes)}`}
          headerColor="var(--color-route-cyan)"
        >
          <EntriesTable
            entries={payEntries}
            fieldConfig={fieldConfig}
            canEdit
            view="pay"
          />
        </SectionCard>

        <QuickAddSheet
          periodId={logPeriod.id}
          fields={template.fields}
          lastEntry={lastEntry}
          canEdit={canLog}
          durationPresets={durationPresets}
          dateRange={dateRange}
        />

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/settings" className="font-medium text-primary hover:underline">
            Pay schedule settings
          </Link>{" "}
          · Open a week to mark ready and send.
        </p>
      </div>
    );
  }

  const weekDate = parseWeekParam(params.week);
  const period = await getOrCreatePeriod(session.user.id, weekDate);
  const fieldConfig: StoredFieldConfig = period.fieldConfigSnapshot
    ? normalizeFieldConfig(period.fieldConfigSnapshot)
    : activeTemplate.fieldConfig;
  const template = {
    ...activeTemplate,
    fieldConfig,
    fields: getVisibleResolvedFields(fieldConfig),
  };

  const visibleEntries = filterEntriesInRange(
    period.entries,
    period.startDate,
    period.endDate,
  );
  const totalMinutes = visibleEntries.reduce((s, e) => s + e.durationMinutes, 0);
  const { prev, next } = getAdjacentWeeks(period.startDate);
  const canEdit = period.status !== "SENT";
  const lastEntry =
    visibleEntries.length > 0
      ? visibleEntries[visibleEntries.length - 1]
      : null;
  const payPeriod = getPayPeriodContaining(today, schedule);
  const dateRange = {
    min: toDateInputValue(period.startDate),
    max: toDateInputValue(period.endDate),
    default: defaultEntryDateForRange(period.startDate, period.endDate, today),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24 lg:space-y-6 lg:pb-8">
      <TodayHero
        todayLabel={todayLabel}
        scopeTitle={formatWeekLabel(period.startDate, period.endDate)}
        scopeSubtitle="Weekly timesheet"
        totalMinutes={totalMinutes}
        entryCount={visibleEntries.length}
        templateName={template.name}
        status={period.status}
        paydayHint={getPaydayDescription(schedule)}
      />

      {extendedPayPeriod ? null : (
        <TimesheetViewTabs
          activeView="week"
          weekStart={toDateInputValue(period.startDate)}
          payStart={toDateInputValue(payPeriod.start)}
        />
      )}

      {extendedPayPeriod ? (
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold sm:text-base">
            {formatWeekLabel(period.startDate, period.endDate)}
          </p>
          <Link
            href={`/?pay=${toDateInputValue(payPeriod.start)}&view=pay`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to pay period
          </Link>
        </div>
      ) : (
        <PeriodNavigator
          label={formatWeekLabel(period.startDate, period.endDate)}
          prevHref={`/?week=${toDateInputValue(prev)}&view=week`}
          nextHref={`/?week=${toDateInputValue(next)}&view=week`}
          prevLabel="Previous week"
          nextLabel="Next week"
        />
      )}

      <SubmissionPanel
        periodId={period.id}
        status={period.status}
        hasEmployerEmail={Boolean(user.employerEmail)}
        emailConfigured={isEmailConfigured()}
        entryCount={visibleEntries.length}
        submissions={period.submissions.map((s) => ({
          id: s.id,
          sentAt: s.sentAt,
          recipientEmail: s.recipientEmail,
        }))}
      />

      <SectionCard
        title="This week"
        description={`${visibleEntries.length} entries · ${formatDuration(totalMinutes)}`}
        headerColor="var(--color-route-cyan)"
      >
        <EntriesTable
          entries={visibleEntries}
          fieldConfig={fieldConfig}
          canEdit={canEdit}
          view="week"
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
              durationPresets={durationPresets}
              dateRange={dateRange}
            />
          </SectionCard>
        </div>
      )}

      <QuickAddSheet
        periodId={period.id}
        fields={template.fields}
        lastEntry={lastEntry}
        canEdit={canEdit}
        durationPresets={durationPresets}
        dateRange={dateRange}
      />

      {!user.employerEmail && (
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
