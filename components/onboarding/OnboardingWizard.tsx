"use client";

import { useActionState, useState } from "react";
import type { JobTitlePreset, PaydayMode, PayPeriodType, PayTimingMode, PeriodCloseMode } from "@prisma/client";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRESET_LIST } from "@/lib/timesheet/presets";
import {
  getPayPeriodTypeLabel,
  getPaydayDescription,
  getSubmissionTimingDescription,
  normalizePaySchedule,
} from "@/lib/timesheet/payPeriod";
import {
  MONTHLY_PAYDAY_OPTIONS,
  PAY_SCHEDULE_WEEKDAYS,
  monthlyPaydayValue,
  parseMonthlyPayday,
} from "@/lib/timesheet/payScheduleOptions";
import { toDateInputValue } from "@/lib/timesheet/periods";
import {
  PayTimingFields,
  defaultPayTimingForType,
} from "@/components/settings/PayTimingFields";
import { cn } from "@/lib/utils";

type OnboardingWizardProps = {
  appName: string;
  name: string;
  email: string;
  activePreset: JobTitlePreset;
  payPeriodType: PayPeriodType;
  paydayMode: PaydayMode;
  paydayOfWeek: number;
  paydayOfMonth: number;
  payPeriodAnchor: Date | null;
  payTimingMode: PayTimingMode;
  periodCloseMode: PeriodCloseMode;
  periodCloseDayOfMonth: number;
  periodCloseDaysBeforePayday: number;
};

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "work", title: "Your work" },
  { id: "pay", title: "Pay schedule" },
  { id: "employer", title: "Employer" },
  { id: "ready", title: "Ready" },
] as const;

const initialState: OnboardingActionState = {};

export function OnboardingWizard({
  appName,
  name: initialName,
  email,
  activePreset: initialPreset,
  payPeriodType: initialPayPeriodType,
  paydayMode: initialPaydayMode,
  paydayOfWeek: initialPaydayOfWeek,
  paydayOfMonth: initialPaydayOfMonth,
  payPeriodAnchor,
  payTimingMode: initialPayTimingMode,
  periodCloseMode: initialPeriodCloseMode,
  periodCloseDayOfMonth: initialPeriodCloseDayOfMonth,
  periodCloseDaysBeforePayday: initialPeriodCloseDaysBeforePayday,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  const [name, setName] = useState(initialName);
  const [preset, setPreset] = useState<JobTitlePreset>(initialPreset);
  const [payPeriodType, setPayPeriodType] = useState<PayPeriodType>(initialPayPeriodType);
  const [paydayOfWeek, setPaydayOfWeek] = useState(initialPaydayOfWeek);
  const [monthlyPayday, setMonthlyPayday] = useState(
    monthlyPaydayValue(initialPaydayMode, initialPaydayOfMonth, initialPaydayOfWeek),
  );
  const [fortnightAnchor, setFortnightAnchor] = useState(
    payPeriodAnchor ? toDateInputValue(new Date(payPeriodAnchor)) : "",
  );
  const [payTiming, setPayTiming] = useState(() =>
    defaultPayTimingForType(initialPayPeriodType, {
      payTimingMode: initialPayTimingMode,
      periodCloseMode: initialPeriodCloseMode,
      periodCloseDayOfMonth: initialPeriodCloseDayOfMonth,
      periodCloseDaysBeforePayday: initialPeriodCloseDaysBeforePayday,
    }),
  );
  const [employerName, setEmployerName] = useState("");
  const [employerEmail, setEmployerEmail] = useState("");
  const [ccSelfOnSubmit, setCcSelfOnSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const parsedMonthly = parseMonthlyPayday(monthlyPayday);
  const selectedPreset = PRESET_LIST.find((p) => p.preset === preset);
  const schedulePreview = normalizePaySchedule({
    payPeriodType,
    paydayMode: parsedMonthly.paydayMode,
    paydayOfWeek:
      payPeriodType === "MONTHLY" ? parsedMonthly.paydayOfWeek : paydayOfWeek,
    paydayOfMonth: parsedMonthly.paydayOfMonth,
    payPeriodAnchor: fortnightAnchor ? new Date(fortnightAnchor) : null,
    ...payTiming,
  });

  const canContinue =
    step === 0
      ? name.trim().length > 0
      : step === 2 && payPeriodType === "FORTNIGHTLY"
        ? fortnightAnchor.length > 0
        : true;

  function goNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8 text-center">
        <p className="transit-hero-label">{appName}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Set up your timesheet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A few quick choices so logging time feels natural from day one.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                index < step
                  ? "bg-primary text-primary-foreground"
                  : index === step
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {index < step ? <Check className="size-4" /> : index + 1}
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "hidden h-0.5 w-6 sm:block",
                  index < step ? "bg-primary" : "bg-muted",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>

      <form action={formAction} className="transit-eta-card overflow-hidden">
        <div
          className="transit-eta-card__header"
          style={{
            backgroundColor:
              selectedPreset?.headerColor ?? "var(--color-brand-secondary)",
          }}
        >
          {STEPS[step].title}
        </div>

        <div className="transit-eta-card__body space-y-6">
          {step === 0 ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Welcome aboard</p>
                  <p className="text-muted-foreground">
                    We&apos;ll tailor your fields, pay period view, and submission
                    settings. You can change everything later in Settings.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-name">What should we call you?</Label>
                <Input
                  id="onboarding-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Pick the style closest to your day-to-day work. This sets which
                fields appear when you log time.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESET_LIST.map((item) => {
                  const selected = preset === item.preset;
                  return (
                    <button
                      key={item.preset}
                      type="button"
                      onClick={() => setPreset(item.preset)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span
                        className="mb-2 inline-block size-2 rounded-full"
                        style={{ backgroundColor: item.headerColor }}
                      />
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="preset" value={preset} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">
                This controls your pay period view and how you move between
                timesheets on the home screen.
              </p>
              <div className="space-y-2">
                <Label htmlFor="payPeriodType">Timesheet length</Label>
                <select
                  id="payPeriodType"
                  name="payPeriodType"
                  value={payPeriodType}
                  onChange={(e) => {
                    const next = e.target.value as PayPeriodType;
                    setPayPeriodType(next);
                    setPayTiming(
                      defaultPayTimingForType(
                        next,
                        next === initialPayPeriodType ? payTiming : undefined,
                      ),
                    );
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="WEEKLY">Weekly (Mon–Sun)</option>
                  <option value="FORTNIGHTLY">Every 2 weeks</option>
                  <option value="MONTHLY">Monthly (calendar month)</option>
                </select>
              </div>

              {payPeriodType === "WEEKLY" ? (
                <div className="space-y-2">
                  <Label htmlFor="paydayOfWeek">Payday</Label>
                  <select
                    id="paydayOfWeek"
                    name="paydayOfWeek"
                    value={paydayOfWeek}
                    onChange={(e) => setPaydayOfWeek(Number(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PAY_SCHEDULE_WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input type="hidden" name="paydayMode" value="DAY_OF_MONTH" />
                  <input type="hidden" name="paydayOfMonth" value="28" />
                </div>
              ) : null}

              {payPeriodType === "MONTHLY" ? (
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayday">Payday</Label>
                  <select
                    id="monthlyPayday"
                    value={monthlyPayday}
                    onChange={(e) => setMonthlyPayday(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {MONTHLY_PAYDAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input type="hidden" name="paydayMode" value={parsedMonthly.paydayMode} />
                  <input type="hidden" name="paydayOfMonth" value={parsedMonthly.paydayOfMonth} />
                  <input type="hidden" name="paydayOfWeek" value={parsedMonthly.paydayOfWeek} />
                </div>
              ) : null}

              {payPeriodType === "FORTNIGHTLY" ? (
                <div className="space-y-2">
                  <Label htmlFor="payPeriodAnchor">Current pay period started</Label>
                  <Input
                    id="payPeriodAnchor"
                    name="payPeriodAnchor"
                    type="date"
                    value={fortnightAnchor}
                    onChange={(e) => setFortnightAnchor(e.target.value)}
                    required
                  />
                  <input type="hidden" name="paydayMode" value="DAY_OF_MONTH" />
                  <input type="hidden" name="paydayOfWeek" value={paydayOfWeek} />
                  <input type="hidden" name="paydayOfMonth" value="28" />
                </div>
              ) : null}

              <PayTimingFields
                payPeriodType={payPeriodType}
                paydayMode={schedulePreview.paydayMode}
                paydayOfWeek={schedulePreview.paydayOfWeek}
                paydayOfMonth={schedulePreview.paydayOfMonth}
                payPeriodAnchor={fortnightAnchor ? new Date(fortnightAnchor) : null}
                payTimingMode={payTiming.payTimingMode}
                periodCloseMode={payTiming.periodCloseMode}
                periodCloseDayOfMonth={payTiming.periodCloseDayOfMonth}
                periodCloseDaysBeforePayday={payTiming.periodCloseDaysBeforePayday}
                onPayTimingModeChange={(mode) => setPayTiming((t) => ({ ...t, payTimingMode: mode }))}
                onPeriodCloseModeChange={(mode) => setPayTiming((t) => ({ ...t, periodCloseMode: mode }))}
                onPeriodCloseDayOfMonthChange={(day) =>
                  setPayTiming((t) => ({ ...t, periodCloseDayOfMonth: day }))
                }
                onPeriodCloseDaysBeforePaydayChange={(days) =>
                  setPayTiming((t) => ({ ...t, periodCloseDaysBeforePayday: days }))
                }
              />

              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {getPaydayDescription(schedulePreview)}
              </p>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Optional for now — add who receives your timesheet PDF when you
                mark a week ready. You can skip and set this later.
              </p>
              <div className="space-y-2">
                <Label htmlFor="employerName">Employer name</Label>
                <Input
                  id="employerName"
                  name="employerName"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  placeholder="Acme Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerEmail">Employer email</Label>
                <Input
                  id="employerEmail"
                  name="employerEmail"
                  type="email"
                  value={employerEmail}
                  onChange={(e) => setEmployerEmail(e.target.value)}
                  placeholder="payroll@company.com"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="ccSelfOnSubmit"
                  checked={ccSelfOnSubmit}
                  onChange={(e) => setCcSelfOnSubmit(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                CC me on submission emails
              </label>
              <div className="space-y-2">
                <Label htmlFor="submitMessage">Default message</Label>
                <Textarea
                  id="submitMessage"
                  name="submitMessage"
                  value={submitMessage}
                  onChange={(e) => setSubmitMessage(e.target.value)}
                  placeholder="Please find my timesheet attached."
                  rows={3}
                />
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what we&apos;ll set up for you. Tap finish to open your
                timesheet.
              </p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-right">{name}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Work style</dt>
                  <dd className="font-medium text-right">{selectedPreset?.label}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Timesheet</dt>
                  <dd className="font-medium text-right">
                    {getPayPeriodTypeLabel(payPeriodType)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Payday</dt>
                  <dd className="max-w-[14rem] text-right font-medium">
                    {getPaydayDescription(schedulePreview)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Submission</dt>
                  <dd className="max-w-[14rem] text-right font-medium">
                    {getSubmissionTimingDescription(schedulePreview) ?? "Weekly"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Employer</dt>
                  <dd className="max-w-[14rem] text-right font-medium">
                    {employerEmail
                      ? `${employerName || "Employer"} · ${employerEmail}`
                      : "Not set yet"}
                  </dd>
                </div>
              </dl>

              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="preset" value={preset} />
              <input type="hidden" name="payPeriodType" value={payPeriodType} />
              <input
                type="hidden"
                name="paydayMode"
                value={
                  payPeriodType === "MONTHLY"
                    ? parsedMonthly.paydayMode
                    : "DAY_OF_MONTH"
                }
              />
              <input
                type="hidden"
                name="paydayOfWeek"
                value={
                  payPeriodType === "MONTHLY"
                    ? parsedMonthly.paydayOfWeek
                    : paydayOfWeek
                }
              />
              <input
                type="hidden"
                name="paydayOfMonth"
                value={
                  payPeriodType === "MONTHLY"
                    ? parsedMonthly.paydayOfMonth
                    : 28
                }
              />
              <input type="hidden" name="payPeriodAnchor" value={fortnightAnchor} />
              <input type="hidden" name="payTimingMode" value={payTiming.payTimingMode} />
              <input type="hidden" name="periodCloseMode" value={payTiming.periodCloseMode} />
              <input type="hidden" name="periodCloseDayOfMonth" value={payTiming.periodCloseDayOfMonth} />
              <input
                type="hidden"
                name="periodCloseDaysBeforePayday"
                value={payTiming.periodCloseDaysBeforePayday}
              />
              <input type="hidden" name="employerName" value={employerName} />
              <input type="hidden" name="employerEmail" value={employerEmail} />
              <input
                type="hidden"
                name="ccSelfOnSubmit"
                value={ccSelfOnSubmit ? "on" : ""}
              />
              <input type="hidden" name="submitMessage" value={submitMessage} />
            </>
          ) : null}

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || pending}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <div className="flex gap-2">
                {step === 3 ? (
                  <Button type="button" variant="ghost" onClick={goNext}>
                    Skip for now
                  </Button>
                ) : null}
                <Button type="button" onClick={goNext} disabled={!canContinue}>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? "Setting up…" : "Finish setup"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
