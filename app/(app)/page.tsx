import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/user";
import { isEmailConfigured } from "@/lib/env";
import {
  getAdjacentWeeks,
  getEntriesForDateRange,
  getOrCreatePeriod,
  getOrCreateSubmissionPeriod,
  parseWeekParam,
} from "@/lib/timesheet/periodQueries";
import { getUserActiveTemplate } from "@/lib/timesheet/templates";
import { getVisibleResolvedFields, resolvePeriodFieldConfig } from "@/lib/timesheet/fieldConfig";
import { normalizeDurationPresets } from "@/lib/timesheet/durationPresets";
import {
  buildEntryDateRangeForPayPeriod,
  buildEntryDateRangeForWeek,
  formatPayPeriodLabel,
  getPayPeriodContaining,
  getPayPeriodTypeLabel,
  getDefaultPayViewAnchor,
  normalizePaySchedule,
  parsePayPeriodParam,
  parseViewParam,
  shiftPayPeriod,
} from "@/lib/timesheet/payPeriod";
import {
  getSubmissionScopeLabel,
  getSubmissionDateRange,
  isSubmissionPeriodComplete,
  shiftSubmissionPeriod,
  usesWeeklySubmission,
} from "@/lib/timesheet/submissionScope";
import {
  formatDuration,
  formatWeekLabel,
  parseDateInput,
  toDateInputValue,
} from "@/lib/timesheet/periods";
import { EntriesTable } from "@/components/timesheet/EntriesTable";
import { QuickAddSheet } from "@/components/timesheet/QuickAddSheet";
import { PeriodNavigator } from "@/components/timesheet/PeriodNavigator";
import { TimesheetViewTabs } from "@/components/timesheet/TimesheetViewTabs";
import { TimesheetSummaryBar } from "@/components/timesheet/TimesheetSummaryBar";
import { SectionCard } from "@/components/transit/SectionCard";
import {
  getNextPaydayDateKey,
  getTimesheetDeadlineKey,
} from "@/lib/timesheet/payCountdown";

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

  const today = new Date();

  if (view === "pay") {
    const payAnchor = params.pay
      ? parsePayPeriodParam(params.pay)
      : getDefaultPayViewAnchor(today, schedule);
    const payPeriod = getSubmissionDateRange(payAnchor, schedule);
    const payStartKey = toDateInputValue(payPeriod.start);
    const prevPayStart = shiftSubmissionPeriod(payPeriod.start, schedule, -1);
    const nextPayStart = shiftSubmissionPeriod(payPeriod.start, schedule, 1);

    const payEntries = await getEntriesForDateRange(
      session.user.id,
      payPeriod.start,
      payPeriod.end,
    );
    const submissionPeriod = await getOrCreateSubmissionPeriod(
      session.user.id,
      schedule,
      payPeriod.start,
    );
    const submissionComplete = isSubmissionPeriodComplete(submissionPeriod.endDate, today);
    const totalMinutes = payEntries.reduce((s, e) => s + e.durationMinutes, 0);
    const dateRange = buildEntryDateRangeForPayPeriod(
      payPeriod.start,
      payPeriod.end,
      today,
    );
    const logPeriod = await getOrCreatePeriod(
      session.user.id,
      parseDateInput(dateRange.default),
    );
    const canLog = submissionPeriod.status !== "SENT";
    const fieldConfig = resolvePeriodFieldConfig(
      logPeriod.fieldConfigSnapshot,
      activeTemplate.fieldConfig,
      submissionPeriod.status,
    );
    const template = {
      ...activeTemplate,
      fieldConfig,
      fields: getVisibleResolvedFields(fieldConfig),
    };
    const lastEntry = payEntries.length > 0 ? payEntries[payEntries.length - 1] : null;
    const paydayDate = getNextPaydayDateKey(today, schedule);
    const deadlineDate = getTimesheetDeadlineKey(today, schedule);

    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-24 lg:space-y-6 lg:pb-8">
        <TimesheetSummaryBar
          entries={payEntries}
          fieldConfig={fieldConfig}
          paydayDate={paydayDate}
          deadlineDate={deadlineDate}
        />

        <TimesheetViewTabs
          activeView="pay"
          weekStart={toDateInputValue(
            (await getOrCreatePeriod(session.user.id, today)).startDate,
          )}
          payStart={payStartKey}
        />

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

        <QuickAddSheet
          periodId={logPeriod.id}
          fields={template.fields}
          lastEntry={lastEntry}
          canEdit={canLog}
          durationPresets={durationPresets}
          dateRange={dateRange}
          submission={{
            periodId: submissionPeriod.id,
            status: submissionPeriod.status,
            scopeLabel: getSubmissionScopeLabel(
              submissionPeriod.startDate,
              submissionPeriod.endDate,
              schedule.payPeriodType,
            ),
            hasEmployerEmail: Boolean(user.employerEmail),
            emailConfigured: isEmailConfigured(),
            entryCount: payEntries.length,
            periodComplete: submissionComplete,
            periodEnd: submissionPeriod.endDate,
          }}
        />

        <SectionCard
          title="Timesheet to submit"
          description={`${payEntries.length} entries · ${formatDuration(totalMinutes)}`}
          headerColor="var(--color-route-cyan)"
        >
          <EntriesTable
            entries={payEntries}
            fieldConfig={fieldConfig}
            canEdit
            view="pay"
            dateRange={dateRange}
          />
        </SectionCard>

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

  const weekDate = parseWeekParam(params.week);
  const period = await getOrCreatePeriod(session.user.id, weekDate);
  const submissionPeriod = await getOrCreateSubmissionPeriod(
    session.user.id,
    schedule,
    weekDate,
  );
  const submissionEntries = await getEntriesForDateRange(
    session.user.id,
    submissionPeriod.startDate,
    submissionPeriod.endDate,
  );
  const fieldConfig = resolvePeriodFieldConfig(
    period.fieldConfigSnapshot,
    activeTemplate.fieldConfig,
    period.status,
  );
  const template = {
    ...activeTemplate,
    fieldConfig,
    fields: getVisibleResolvedFields(fieldConfig),
  };

  const visibleEntries = await getEntriesForDateRange(
    session.user.id,
    period.startDate,
    period.endDate,
  );
  const totalMinutes = visibleEntries.reduce((s, e) => s + e.durationMinutes, 0);
  const { prev, next } = getAdjacentWeeks(period.startDate);
  const canEdit =
    period.status !== "SENT" && submissionPeriod.status !== "SENT";
  const submissionScopeLabel = getSubmissionScopeLabel(
    submissionPeriod.startDate,
    submissionPeriod.endDate,
    schedule.payPeriodType,
  );
  const submissionComplete = isSubmissionPeriodComplete(
    submissionPeriod.endDate,
    today,
  );
  const showWeekSubmission = usesWeeklySubmission(schedule);
  const lastEntry =
    visibleEntries.length > 0
      ? visibleEntries[visibleEntries.length - 1]
      : null;
  const payPeriod = getPayPeriodContaining(today, schedule);
  const dateRange = buildEntryDateRangeForWeek(
    period.startDate,
    period.endDate,
    today,
  );
  const paydayDate = getNextPaydayDateKey(today, schedule);
  const deadlineDate = getTimesheetDeadlineKey(today, schedule);

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24 lg:space-y-6 lg:pb-8">
      <TimesheetSummaryBar
        entries={visibleEntries}
        fieldConfig={fieldConfig}
        paydayDate={paydayDate}
        deadlineDate={deadlineDate}
      />

      <TimesheetViewTabs
        activeView="week"
        weekStart={toDateInputValue(period.startDate)}
        payStart={toDateInputValue(payPeriod.start)}
      />

      <PeriodNavigator
        label={formatWeekLabel(period.startDate, period.endDate)}
        prevHref={`/?week=${toDateInputValue(prev)}&view=week`}
        nextHref={`/?week=${toDateInputValue(next)}&view=week`}
        prevLabel="Previous week"
        nextLabel="Next week"
      />

      <QuickAddSheet
        periodId={period.id}
        fields={template.fields}
        lastEntry={lastEntry}
        canEdit={canEdit}
        durationPresets={durationPresets}
        dateRange={dateRange}
        submission={
          showWeekSubmission
            ? {
                periodId: submissionPeriod.id,
                status: submissionPeriod.status,
                scopeLabel: submissionScopeLabel,
                hasEmployerEmail: Boolean(user.employerEmail),
                emailConfigured: isEmailConfigured(),
                entryCount: submissionEntries.length,
                periodComplete: submissionComplete,
                periodEnd: submissionPeriod.endDate,
              }
            : undefined
        }
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
          dateRange={dateRange}
        />
      </SectionCard>

      {!showWeekSubmission ? (
        <p className="text-center text-sm text-muted-foreground">
          Submit your{" "}
          <span className="font-medium text-foreground">
            {getPayPeriodTypeLabel(schedule.payPeriodType).toLowerCase()}
          </span>{" "}
          timesheet from the{" "}
          <Link
            href={`/?pay=${toDateInputValue(payPeriod.start)}&view=pay`}
            className="font-medium text-primary hover:underline"
          >
            Pay period
          </Link>{" "}
          tab.
        </p>
      ) : null}

      {!user.employerEmail && showWeekSubmission && (
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
