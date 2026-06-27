"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addDurationHourPreset,
  addDurationMinutePreset,
  removeDurationHourPreset,
  removeDurationMinutePreset,
} from "@/actions/durationPresets";
import {
  canAddHourPreset,
  canAddMinutePreset,
  countCustomPresets,
  formatDurationLabel,
  formatHourChip,
  formatMinuteChip,
  getHourPresets,
  getMinutePresets,
  isDefaultHourPreset,
  isDefaultMinutePreset,
  sanitizeCustomHours,
  sanitizeCustomMinutes,
  type StoredDurationPresets,
} from "@/lib/timesheet/durationPresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DurationQuickPickProps = {
  hours: number;
  minutes: number;
  durationPresets: StoredDurationPresets;
  required?: boolean;
  onChange: (hours: number, minutes: number) => void;
};

function DurationChip({
  label,
  active,
  custom,
  onClick,
}: {
  label: string;
  active: boolean;
  custom?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : custom
            ? "border-primary/35 bg-primary/5 hover:bg-primary/10"
            : "border-border bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function DurationRow({
  label,
  presets,
  value,
  max,
  formatValue,
  isDefaultPreset,
  inputId,
  inputName,
  required,
  onChange,
  onPickPreset,
}: {
  label: string;
  presets: number[];
  value: number;
  max: number;
  formatValue: (n: number) => string;
  isDefaultPreset: (n: number) => boolean;
  inputId: string;
  inputName: string;
  required?: boolean;
  onChange: (value: number) => void;
  onPickPreset: (value: number) => void;
}) {
  const onPreset = presets.includes(value);
  const [customOpen, setCustomOpen] = useState(!onPreset);

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant={customOpen ? "secondary" : "outline"}
          size="sm"
          className="h-8 shrink-0 px-3 text-xs"
          onClick={() => setCustomOpen((open) => !open)}
        >
          {customOpen ? "Hide" : "Custom"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <DurationChip
            key={preset}
            label={formatValue(preset)}
            active={value === preset && !customOpen}
            custom={!isDefaultPreset(preset)}
            onClick={() => {
              onPickPreset(preset);
              setCustomOpen(false);
            }}
          />
        ))}
      </div>

      {customOpen ? (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-label={`Decrease ${label.toLowerCase()}`}
            onClick={() => onChange(Math.max(0, value - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              id={inputId}
              name={inputName}
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              value={value}
              onChange={(e) => {
                const next = Number(e.target.value);
                onChange(Number.isNaN(next) ? 0 : Math.min(max, Math.max(0, next)));
              }}
              required={required}
              className="h-9 text-center text-base font-medium"
              aria-label={label}
            />
            <span className="shrink-0 text-sm text-muted-foreground">
              {label.toLowerCase()}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => onChange(Math.min(max, value + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      ) : (
        <input type="hidden" name={inputName} value={value} />
      )}
    </div>
  );
}

export function DurationQuickPick({
  hours,
  minutes,
  durationPresets,
  required = false,
  onChange,
}: DurationQuickPickProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const hourPresets = getHourPresets(durationPresets);
  const minutePresets = getMinutePresets(durationPresets);
  const customHours = sanitizeCustomHours(durationPresets.customHours);
  const customMinutes = sanitizeCustomMinutes(durationPresets.customMinutes);
  const customCount = countCustomPresets(durationPresets);
  const hourAddError = canAddHourPreset(hours, durationPresets);
  const minuteAddError = canAddMinutePreset(minutes, durationPresets);

  function runAction(
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Logging</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {formatDurationLabel(hours, minutes)}
          </p>
        </div>
        <Button
          type="button"
          variant={shortcutsOpen ? "secondary" : "outline"}
          className="flex h-auto w-[4.5rem] shrink-0 flex-col gap-1 px-2 py-3"
          onClick={() => setShortcutsOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-4" />
          <span className="text-[10px] leading-tight font-medium">
            {shortcutsOpen ? "Done" : "My buttons"}
          </span>
          {!shortcutsOpen && customCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {customCount}
            </span>
          ) : null}
        </Button>
      </div>

      {shortcutsOpen ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div>
            <p className="text-sm font-medium">Save quick buttons</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Set a time, then pin values you use every week.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-2 text-xs"
              disabled={pending || Boolean(hourAddError)}
              onClick={() =>
                runAction(
                  () => addDurationHourPreset(hours),
                  `${formatHourChip(hours)} added`,
                )
              }
            >
              Pin {formatHourChip(hours)}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-2 text-xs"
              disabled={pending || Boolean(minuteAddError)}
              onClick={() =>
                runAction(
                  () => addDurationMinutePreset(minutes),
                  `${formatMinuteChip(minutes)} added`,
                )
              }
            >
              Pin {formatMinuteChip(minutes)}
            </Button>
          </div>
          {(hourAddError || minuteAddError) && (
            <p className="text-xs text-muted-foreground">
              {[hourAddError, minuteAddError].filter(Boolean).join(" · ")}
            </p>
          )}
          {customCount > 0 ? (
            <ul className="space-y-1.5 border-t border-border pt-3">
              {customHours.map((h) => (
                <li
                  key={`h-${h}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span>{formatHourChip(h)} button</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        () => removeDurationHourPreset(h),
                        `${formatHourChip(h)} removed`,
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
              {customMinutes.map((m) => (
                <li
                  key={`m-${m}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span>{formatMinuteChip(m)} button</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        () => removeDurationMinutePreset(m),
                        `${formatMinuteChip(m)} removed`,
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved buttons yet — pin an hour or minute you use often.
            </p>
          )}
        </div>
      ) : null}

      <DurationRow
        label="Hours"
        presets={hourPresets}
        value={hours}
        max={24}
        formatValue={formatHourChip}
        isDefaultPreset={isDefaultHourPreset}
        inputId="durationHours"
        inputName="durationHours"
        required={required}
        onChange={(h) => onChange(h, minutes)}
        onPickPreset={(h) => onChange(h, minutes)}
      />

      <DurationRow
        label="Minutes"
        presets={minutePresets}
        value={minutes}
        max={59}
        formatValue={formatMinuteChip}
        isDefaultPreset={isDefaultMinutePreset}
        inputId="durationMinutesInput"
        inputName="durationMinutes"
        onChange={(m) => onChange(hours, m)}
        onPickPreset={(m) => onChange(hours, m)}
      />
    </div>
  );
}
