"use client";

import type { PayPeriodType, PayTimingMode, PeriodCloseMode } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSubmissionTimingDescription,
  PERIOD_CLOSE_DAY_OPTIONS,
  type PayTimingFormValues,
} from "@/lib/timesheet/payTiming";
import { normalizePaySchedule } from "@/lib/timesheet/payPeriod";
import type { PaydayMode } from "@prisma/client";
import { cn } from "@/lib/utils";

type PayTimingFieldsProps = {
  payPeriodType: PayPeriodType;
  paydayMode: PaydayMode;
  paydayOfWeek: number;
  paydayOfMonth: number;
  payPeriodAnchor: Date | null;
  payTimingMode: PayTimingMode;
  periodCloseMode: PeriodCloseMode;
  periodCloseDayOfMonth: number;
  periodCloseDaysBeforePayday: number;
  onPayTimingModeChange: (mode: PayTimingMode) => void;
  onPeriodCloseModeChange: (mode: PeriodCloseMode) => void;
  onPeriodCloseDayOfMonthChange: (day: number) => void;
  onPeriodCloseDaysBeforePaydayChange: (days: number) => void;
};

export function PayTimingFields({
  payPeriodType,
  paydayMode,
  paydayOfWeek,
  paydayOfMonth,
  payPeriodAnchor,
  payTimingMode,
  periodCloseMode,
  periodCloseDayOfMonth,
  periodCloseDaysBeforePayday,
  onPayTimingModeChange,
  onPeriodCloseModeChange,
  onPeriodCloseDayOfMonthChange,
  onPeriodCloseDaysBeforePaydayChange,
}: PayTimingFieldsProps) {
  if (payPeriodType === "WEEKLY") {
    return <input type="hidden" name="payTimingMode" value="PAY_IN_ARREARS" />;
  }

  const schedulePreview = normalizePaySchedule({
    payPeriodType,
    paydayMode,
    paydayOfWeek,
    paydayOfMonth,
    payPeriodAnchor,
    payTimingMode,
    periodCloseMode,
    periodCloseDayOfMonth,
    periodCloseDaysBeforePayday,
  });

  const showDayOfMonth = payPeriodType === "MONTHLY";

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">When to submit</legend>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
          payTimingMode === "PAY_IN_ARREARS" ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <input
          type="radio"
          name="payTimingMode"
          value="PAY_IN_ARREARS"
          checked={payTimingMode === "PAY_IN_ARREARS"}
          onChange={() => onPayTimingModeChange("PAY_IN_ARREARS")}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">Pay in arrears</span>
          <span className="mt-0.5 block text-muted-foreground">
            Submit the previous pay period — paid on this payday.
          </span>
        </span>
      </label>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
          payTimingMode === "PERIOD_CLOSES_ON" ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <input
          type="radio"
          name="payTimingMode"
          value="PERIOD_CLOSES_ON"
          checked={payTimingMode === "PERIOD_CLOSES_ON"}
          onChange={() => onPayTimingModeChange("PERIOD_CLOSES_ON")}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">Period closes on</span>
          <span className="mt-0.5 block text-muted-foreground">
            Submit after a fixed close date each cycle.
          </span>
        </span>
      </label>

      {payTimingMode === "PERIOD_CLOSES_ON" ? (
        <div className="ml-1 space-y-3 border-l-2 border-border pl-4">
          {showDayOfMonth ? (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                periodCloseMode === "DAY_OF_MONTH"
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <input
                type="radio"
                name="periodCloseMode"
                value="DAY_OF_MONTH"
                checked={periodCloseMode === "DAY_OF_MONTH"}
                onChange={() => onPeriodCloseModeChange("DAY_OF_MONTH")}
                className="mt-0.5"
              />
              <span className="flex-1 text-sm">
                <span className="font-medium">Day of month</span>
                <select
                  name="periodCloseDayOfMonth"
                  value={periodCloseDayOfMonth}
                  onChange={(e) => onPeriodCloseDayOfMonthChange(Number(e.target.value))}
                  className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {PERIOD_CLOSE_DAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          ) : (
            <input type="hidden" name="periodCloseMode" value="DAYS_BEFORE_PAYDAY" />
          )}

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
              periodCloseMode === "DAYS_BEFORE_PAYDAY"
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            <input
              type="radio"
              name="periodCloseMode"
              value="DAYS_BEFORE_PAYDAY"
              checked={periodCloseMode === "DAYS_BEFORE_PAYDAY"}
              onChange={() => onPeriodCloseModeChange("DAYS_BEFORE_PAYDAY")}
              className="mt-0.5"
            />
            <span className="flex-1 text-sm">
              <span className="font-medium">Days before payday</span>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  name="periodCloseDaysBeforePayday"
                  type="number"
                  min={0}
                  max={90}
                  value={periodCloseDaysBeforePayday}
                  onChange={(e) =>
                    onPeriodCloseDaysBeforePaydayChange(Number(e.target.value))
                  }
                  className="w-20"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-muted-foreground">days before payday</span>
              </div>
            </span>
          </label>

          {showDayOfMonth && periodCloseMode === "DAY_OF_MONTH" ? (
            <input type="hidden" name="periodCloseDaysBeforePayday" value={0} />
          ) : null}
          {!showDayOfMonth || periodCloseMode === "DAYS_BEFORE_PAYDAY" ? (
            <input type="hidden" name="periodCloseDayOfMonth" value={31} />
          ) : null}
        </div>
      ) : (
        <>
          <input type="hidden" name="periodCloseMode" value="DAY_OF_MONTH" />
          <input type="hidden" name="periodCloseDayOfMonth" value={31} />
          <input type="hidden" name="periodCloseDaysBeforePayday" value={0} />
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {getSubmissionTimingDescription(schedulePreview)}
      </p>
    </fieldset>
  );
}

export function defaultPayTimingForType(
  payPeriodType: PayPeriodType,
  existing?: Partial<PayTimingFormValues>,
): PayTimingFormValues {
  if (payPeriodType === "WEEKLY") {
    return {
      payTimingMode: "PAY_IN_ARREARS",
      periodCloseMode: "DAY_OF_MONTH",
      periodCloseDayOfMonth: 31,
      periodCloseDaysBeforePayday: 0,
    };
  }
  return {
    payTimingMode: existing?.payTimingMode ?? "PAY_IN_ARREARS",
    periodCloseMode: existing?.periodCloseMode ?? "DAY_OF_MONTH",
    periodCloseDayOfMonth: existing?.periodCloseDayOfMonth ?? 31,
    periodCloseDaysBeforePayday: existing?.periodCloseDaysBeforePayday ?? 0,
  };
}
