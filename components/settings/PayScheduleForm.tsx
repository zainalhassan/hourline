"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaydayMode, PayPeriodType } from "@prisma/client";
import {
  updatePaySchedule,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/timesheet/periods";

type PayScheduleFormProps = {
  payPeriodType: PayPeriodType;
  paydayMode: PaydayMode;
  paydayOfWeek: number;
  paydayOfMonth: number;
  payPeriodAnchor: Date | null;
};

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const last = day % 10;
  if (last === 1) return `${day}st`;
  if (last === 2) return `${day}nd`;
  if (last === 3) return `${day}rd`;
  return `${day}th`;
}

const MONTHLY_PAYDAY_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const suffix = day > 28 ? " (or last day in shorter months)" : "";
    return {
      value: `day:${day}`,
      label: `${ordinal(day)} of the month${suffix}`,
    };
  }),
  ...WEEKDAYS.map((day) => ({
    value: `last:${day.value}`,
    label: `Last ${day.label} of the month`,
  })),
];

function monthlyPaydayValue(mode: PaydayMode, dayOfMonth: number, dayOfWeek: number) {
  if (mode === "LAST_WEEKDAY_OF_MONTH") {
    return `last:${dayOfWeek}`;
  }
  return `day:${dayOfMonth}`;
}

function parseMonthlyPayday(value: string): {
  paydayMode: PaydayMode;
  paydayOfMonth: number;
  paydayOfWeek: number;
} {
  if (value.startsWith("last:")) {
    return {
      paydayMode: "LAST_WEEKDAY_OF_MONTH",
      paydayOfMonth: 28,
      paydayOfWeek: Number(value.slice(5)),
    };
  }
  return {
    paydayMode: "DAY_OF_MONTH",
    paydayOfMonth: Number(value.slice(4)),
    paydayOfWeek: 5,
  };
}

const initialState: SettingsActionState = {};

export function PayScheduleForm({
  payPeriodType: initialType,
  paydayMode: initialPaydayMode,
  paydayOfWeek,
  paydayOfMonth,
  payPeriodAnchor,
}: PayScheduleFormProps) {
  const [state, formAction, pending] = useActionState(updatePaySchedule, initialState);
  const [payPeriodType, setPayPeriodType] = useState<PayPeriodType>(initialType);
  const [monthlyPayday, setMonthlyPayday] = useState(
    monthlyPaydayValue(initialPaydayMode, paydayOfMonth, paydayOfWeek),
  );
  const parsedMonthly = parseMonthlyPayday(monthlyPayday);

  useEffect(() => {
    if (state.success) toast.success("Pay schedule saved");
  }, [state.success]);

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="payPeriodType">Timesheet length</Label>
        <select
          id="payPeriodType"
          name="payPeriodType"
          value={payPeriodType}
          onChange={(e) => setPayPeriodType(e.target.value as PayPeriodType)}
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
            defaultValue={paydayOfWeek}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {WEEKDAYS.map((day) => (
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
            defaultValue={
              payPeriodAnchor ? toDateInputValue(new Date(payPeriodAnchor)) : ""
            }
          />
          <p className="text-xs text-muted-foreground">
            Pick the first day of your current fortnight so we can line up the cycle.
          </p>
        </div>
      ) : null}

      {payPeriodType !== "WEEKLY" && payPeriodType !== "MONTHLY" ? (
        <input type="hidden" name="paydayOfWeek" value={paydayOfWeek} />
      ) : null}
      {payPeriodType !== "MONTHLY" ? (
        <>
          <input type="hidden" name="paydayMode" value="DAY_OF_MONTH" />
          <input type="hidden" name="paydayOfMonth" value={paydayOfMonth} />
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
