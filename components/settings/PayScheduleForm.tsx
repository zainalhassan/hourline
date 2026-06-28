"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PaydayMode, PayPeriodType, PayTimingMode, PeriodCloseMode } from "@prisma/client";
import {
  updatePaySchedule,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/timesheet/periods";
import { normalizePaySchedule } from "@/lib/timesheet/payPeriod";
import {
  MONTHLY_PAYDAY_OPTIONS,
  PAY_SCHEDULE_WEEKDAYS,
  monthlyPaydayValue,
  parseMonthlyPayday,
} from "@/lib/timesheet/payScheduleOptions";
import {
  PayTimingFields,
  defaultPayTimingForType,
} from "@/components/settings/PayTimingFields";

type PayScheduleFormProps = {
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

const initialState: SettingsActionState = {};

function buildPayTimingState(
  payPeriodType: PayPeriodType,
  payTimingMode: PayTimingMode,
  periodCloseMode: PeriodCloseMode,
  periodCloseDayOfMonth: number,
  periodCloseDaysBeforePayday: number,
) {
  return defaultPayTimingForType(payPeriodType, {
    payTimingMode,
    periodCloseMode,
    periodCloseDayOfMonth,
    periodCloseDaysBeforePayday,
  });
}

export function PayScheduleForm({
  payPeriodType: initialType,
  paydayMode: initialPaydayMode,
  paydayOfWeek: initialPaydayOfWeek,
  paydayOfMonth: initialPaydayOfMonth,
  payPeriodAnchor: initialPayPeriodAnchor,
  payTimingMode: initialPayTimingMode,
  periodCloseMode: initialPeriodCloseMode,
  periodCloseDayOfMonth: initialPeriodCloseDayOfMonth,
  periodCloseDaysBeforePayday: initialPeriodCloseDaysBeforePayday,
}: PayScheduleFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePaySchedule, initialState);
  const [payPeriodType, setPayPeriodType] = useState<PayPeriodType>(initialType);
  const [paydayOfWeek, setPaydayOfWeek] = useState(initialPaydayOfWeek);
  const [payPeriodAnchor, setPayPeriodAnchor] = useState(
    initialPayPeriodAnchor ? toDateInputValue(new Date(initialPayPeriodAnchor)) : "",
  );
  const [payTiming, setPayTiming] = useState(() =>
    buildPayTimingState(
      initialType,
      initialPayTimingMode,
      initialPeriodCloseMode,
      initialPeriodCloseDayOfMonth,
      initialPeriodCloseDaysBeforePayday,
    ),
  );
  const [monthlyPayday, setMonthlyPayday] = useState(
    monthlyPaydayValue(initialPaydayMode, initialPaydayOfMonth, initialPaydayOfWeek),
  );

  useEffect(() => {
    setPayPeriodType(initialType);
    setPaydayOfWeek(initialPaydayOfWeek);
    setPayPeriodAnchor(
      initialPayPeriodAnchor ? toDateInputValue(new Date(initialPayPeriodAnchor)) : "",
    );
    setPayTiming(
      buildPayTimingState(
        initialType,
        initialPayTimingMode,
        initialPeriodCloseMode,
        initialPeriodCloseDayOfMonth,
        initialPeriodCloseDaysBeforePayday,
      ),
    );
    setMonthlyPayday(
      monthlyPaydayValue(initialPaydayMode, initialPaydayOfMonth, initialPaydayOfWeek),
    );
  }, [
    initialType,
    initialPaydayMode,
    initialPaydayOfWeek,
    initialPaydayOfMonth,
    initialPayPeriodAnchor,
    initialPayTimingMode,
    initialPeriodCloseMode,
    initialPeriodCloseDayOfMonth,
    initialPeriodCloseDaysBeforePayday,
  ]);

  useEffect(() => {
    if (state.success) {
      toast.success("Pay schedule saved");
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, router]);

  const parsedMonthly = parseMonthlyPayday(monthlyPayday);
  const schedulePreview = normalizePaySchedule({
    payPeriodType,
    paydayMode: payPeriodType === "MONTHLY" ? parsedMonthly.paydayMode : "DAY_OF_MONTH",
    paydayOfWeek: payPeriodType === "MONTHLY" ? parsedMonthly.paydayOfWeek : paydayOfWeek,
    paydayOfMonth: parsedMonthly.paydayOfMonth,
    payPeriodAnchor: payPeriodAnchor ? new Date(payPeriodAnchor) : null,
    ...payTiming,
  });

  return (
    <form action={formAction} className="max-w-md space-y-6">
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
                next === initialType
                  ? {
                      payTimingMode: initialPayTimingMode,
                      periodCloseMode: initialPeriodCloseMode,
                      periodCloseDayOfMonth: initialPeriodCloseDayOfMonth,
                      periodCloseDaysBeforePayday: initialPeriodCloseDaysBeforePayday,
                    }
                  : undefined,
              ),
            );
          }}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="WEEKLY">Weekly (Mon–Sun)</option>
          <option value="FORTNIGHTLY">Every 2 weeks</option>
          <option value="MONTHLY">Monthly (calendar month)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Controls your pay period view on the home screen.
        </p>
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
            value={payPeriodAnchor}
            onChange={(e) => setPayPeriodAnchor(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pick the first day of your current fortnight so we can line up the cycle.
          </p>
        </div>
      ) : null}

      <PayTimingFields
        payPeriodType={payPeriodType}
        paydayMode={schedulePreview.paydayMode}
        paydayOfWeek={schedulePreview.paydayOfWeek}
        paydayOfMonth={schedulePreview.paydayOfMonth}
        payPeriodAnchor={payPeriodAnchor ? new Date(payPeriodAnchor) : null}
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

      {payPeriodType !== "WEEKLY" && payPeriodType !== "MONTHLY" ? (
        <input type="hidden" name="paydayOfWeek" value={paydayOfWeek} />
      ) : null}
      {payPeriodType !== "MONTHLY" ? (
        <>
          <input type="hidden" name="paydayMode" value="DAY_OF_MONTH" />
          <input type="hidden" name="paydayOfMonth" value={initialPaydayOfMonth} />
        </>
      ) : null}
      {payPeriodType !== "FORTNIGHTLY" ? (
        <input type="hidden" name="payPeriodAnchor" value="" />
      ) : null}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save pay schedule"}
      </Button>
    </form>
  );
}
