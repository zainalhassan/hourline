"use client";

import type { TimeEntry } from "@prisma/client";
import {
  TIMESHEET_FIELDS,
  type EntryMetadata,
} from "@/lib/timesheet/fields";
import {
  getEntryFieldValue,
  getMileageFromEntry,
  type ResolvedField,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { toDateInputValue } from "@/lib/timesheet/periods";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EntryFieldInputsProps = {
  fields: ResolvedField[];
  entry?: TimeEntry;
  prefill?: Record<string, string>;
  showDate?: boolean;
  defaultDate?: string;
  durationHours?: number;
  durationMinutes?: number;
  onDurationChange?: (hours: number, minutes: number) => void;
  compact?: boolean;
};

function getMeta(entry?: TimeEntry): EntryMetadata & Record<string, unknown> {
  return (entry?.metadata as EntryMetadata & Record<string, unknown>) ?? {};
}

export function EntryFieldInputs({
  fields,
  entry,
  prefill = {},
  showDate = true,
  defaultDate,
  durationHours: controlledHours,
  durationMinutes: controlledMinutes,
  onDurationChange,
  compact = false,
}: EntryFieldInputsProps) {
  const meta = getMeta(entry);
  const hours =
    controlledHours ?? (entry ? Math.floor(entry.durationMinutes / 60) : 0);
  const minutes =
    controlledMinutes ?? (entry ? entry.durationMinutes % 60 : 0);
  const dateValue =
    defaultDate ??
    (entry ? toDateInputValue(new Date(entry.entryDate)) : toDateInputValue(new Date()));

  function defaultForBuiltIn(key: string, fieldDefault?: string) {
    if (entry) {
      if (key === "mileage") {
        const m = getMileageFromEntry(entry);
        return m != null ? String(m) : "";
      }
      return (meta[key as keyof EntryMetadata] as string) ?? "";
    }
    return prefill[key] ?? fieldDefault ?? "";
  }

  return (
    <>
      {showDate && (
        <div className="space-y-2">
          <Label htmlFor="entryDate">Date</Label>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            defaultValue={dateValue}
            required
          />
        </div>
      )}

      {fields.map((field) => {
        if (field.kind === "builtIn" && field.fieldKey === "durationMinutes") {
          return (
            <div key={field.fieldKey} className="space-y-2">
              <Label>Duration</Label>
              {compact && onDurationChange ? (
                <DurationChips
                  hours={hours}
                  minutes={minutes}
                  onChange={onDurationChange}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="durationHours" className="text-xs text-muted-foreground">
                    Hours
                  </Label>
                  <Input
                    id="durationHours"
                    name="durationHours"
                    type="number"
                    min={0}
                    max={24}
                    value={hours}
                    onChange={(e) =>
                      onDurationChange?.(Number(e.target.value) || 0, minutes)
                    }
                    defaultValue={onDurationChange ? undefined : hours}
                    required={field.required}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutesInput" className="text-xs text-muted-foreground">
                    Minutes
                  </Label>
                  <Input
                    id="durationMinutesInput"
                    name="durationMinutes"
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) =>
                      onDurationChange?.(hours, Number(e.target.value) || 0)
                    }
                    defaultValue={onDurationChange ? undefined : minutes}
                  />
                </div>
              </div>
            </div>
          );
        }

        if (field.kind === "builtIn" && field.fieldKey === "billable") {
          return (
            <div key={field.fieldKey} className="flex items-center gap-2">
              <input
                id="billable"
                name="billable"
                type="checkbox"
                defaultChecked={entry ? Boolean(meta.billable) : prefill.billable === "true"}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="billable">{TIMESHEET_FIELDS.billable.label}</Label>
            </div>
          );
        }

        if (field.kind === "builtIn") {
          const def = TIMESHEET_FIELDS[field.fieldKey];
          if (def.type === "textarea") {
            return (
              <div key={field.fieldKey} className="space-y-2">
                <Label htmlFor={field.fieldKey}>{def.label}</Label>
                <Textarea
                  id={field.fieldKey}
                  name={field.fieldKey}
                  placeholder={def.placeholder}
                  defaultValue={defaultForBuiltIn(field.fieldKey, field.defaultValue)}
                  required={field.required}
                />
              </div>
            );
          }

          return (
            <div key={field.fieldKey} className="space-y-2">
              <Label htmlFor={field.fieldKey}>{def.label}</Label>
              <Input
                id={field.fieldKey}
                name={field.fieldKey}
                type={def.type === "number" ? "number" : "text"}
                step={field.fieldKey === "mileage" ? "0.01" : undefined}
                min={def.type === "number" ? 0 : undefined}
                placeholder={def.placeholder}
                defaultValue={defaultForBuiltIn(field.fieldKey, field.defaultValue)}
                required={field.required}
              />
            </div>
          );
        }

        const name = `custom_${field.id}`;
        if (field.type === "checkbox") {
          return (
            <div key={field.id} className="flex items-center gap-2">
              <input
                id={name}
                name={name}
                type="checkbox"
                defaultChecked={
                  entry
                    ? Boolean(meta[field.id])
                    : prefill[field.id] === "true"
                }
                className="size-4 rounded border-border"
              />
              <Label htmlFor={name}>{field.label}</Label>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={name}>{field.label}</Label>
              <Textarea
                id={name}
                name={name}
                defaultValue={
                  entry
                    ? getEntryFieldValue(entry, field)
                    : prefill[field.id] ?? field.defaultValue ?? ""
                }
                required={field.required}
              />
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={name}>{field.label}</Label>
            <Input
              id={name}
              name={name}
              type={field.type === "number" ? "number" : "text"}
              min={field.type === "number" ? 0 : undefined}
              defaultValue={
                entry
                  ? getEntryFieldValue(entry, field)
                  : prefill[field.id] ?? field.defaultValue ?? ""
              }
              required={field.required}
            />
          </div>
        );
      })}
    </>
  );
}

const DURATION_PRESETS = [
  { label: "15m", hours: 0, minutes: 15 },
  { label: "30m", hours: 0, minutes: 30 },
  { label: "1h", hours: 1, minutes: 0 },
  { label: "2h", hours: 2, minutes: 0 },
  { label: "4h", hours: 4, minutes: 0 },
  { label: "8h", hours: 8, minutes: 0 },
] as const;

function DurationChips({
  hours,
  minutes,
  onChange,
}: {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
}) {
  const total = hours * 60 + minutes;

  return (
    <div className="flex flex-wrap gap-2">
      {DURATION_PRESETS.map((preset) => {
        const presetTotal = preset.hours * 60 + preset.minutes;
        const active = total === presetTotal;
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.hours, preset.minutes)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

export function getRequiredFields(fields: ResolvedField[]) {
  return fields.filter((f) => f.required);
}

export function getQuickFields(fields: ResolvedField[]) {
  const required = fields.filter(
    (f) =>
      f.required &&
      !(f.kind === "builtIn" && f.fieldKey === "durationMinutes"),
  );
  const optional = fields.filter(
    (f) =>
      !f.required &&
      f.visible &&
      !(f.kind === "builtIn" && ["durationMinutes", "notes", "mileageDescription"].includes(f.fieldKey)),
  );
  return { required, optional };
}
