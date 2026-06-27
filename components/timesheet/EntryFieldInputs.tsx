"use client";

import type { ReactNode } from "react";
import type { TimeEntry } from "@prisma/client";
import {
  TIMESHEET_FIELDS,
  type EntryMetadata,
} from "@/lib/timesheet/fields";
import { DurationQuickPick } from "@/components/timesheet/DurationQuickPick";
import {
  getEntryFieldValue,
  getMileageFromEntry,
  type ResolvedField,
} from "@/lib/timesheet/fieldConfig";
import type { StoredDurationPresets } from "@/lib/timesheet/durationPresets";
import { toDateInputValue } from "@/lib/timesheet/periods";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldLabelProps = {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  showOptional?: boolean;
  className?: string;
};

function FieldLabel({
  htmlFor,
  children,
  required = false,
  showOptional = false,
  className,
}: FieldLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={className}>
      <span>{children}</span>
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
      {showOptional && !required ? (
        <span className="text-xs font-normal text-muted-foreground">(optional)</span>
      ) : null}
    </Label>
  );
}

type EntryFieldInputsProps = {
  fields: ResolvedField[];
  entry?: TimeEntry;
  prefill?: Record<string, string>;
  showDate?: boolean;
  defaultDate?: string;
  dateMin?: string;
  dateMax?: string;
  durationHours?: number;
  durationMinutes?: number;
  onDurationChange?: (hours: number, minutes: number) => void;
  compact?: boolean;
  showOptionalLabels?: boolean;
  durationPresets?: StoredDurationPresets;
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
  dateMin,
  dateMax,
  durationHours: controlledHours,
  durationMinutes: controlledMinutes,
  onDurationChange,
  compact = false,
  showOptionalLabels = false,
  durationPresets = { customHours: [], customMinutes: [] },
}: EntryFieldInputsProps) {
  const meta = getMeta(entry);
  const isDurationControlled = onDurationChange != null;
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
          <FieldLabel htmlFor="entryDate" required>
            Date
          </FieldLabel>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            defaultValue={dateValue}
            min={dateMin}
            max={dateMax}
            required
          />
        </div>
      )}

      {fields.map((field) => {
        if (field.kind === "builtIn" && field.fieldKey === "durationMinutes") {
          const showQuickPick = compact && isDurationControlled;

          return (
            <div key={field.fieldKey} className="space-y-2">
              <FieldLabel required={field.required}>Duration</FieldLabel>
              {showQuickPick ? (
                <DurationQuickPick
                  hours={hours}
                  minutes={minutes}
                  durationPresets={durationPresets}
                  required={field.required}
                  onChange={onDurationChange}
                />
              ) : (
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
                      {...(isDurationControlled
                        ? {
                            value: hours,
                            onChange: (e) =>
                              onDurationChange(Number(e.target.value) || 0, minutes),
                          }
                        : { defaultValue: hours })}
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
                      {...(isDurationControlled
                        ? {
                            value: minutes,
                            onChange: (e) =>
                              onDurationChange(hours, Number(e.target.value) || 0),
                          }
                        : { defaultValue: minutes })}
                    />
                  </div>
                </div>
              )}
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
              <Label htmlFor="billable" className="font-medium">
                {TIMESHEET_FIELDS.billable.label}
                {showOptionalLabels ? (
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                ) : null}
              </Label>
            </div>
          );
        }

        if (field.kind === "builtIn") {
          const def = TIMESHEET_FIELDS[field.fieldKey];
          if (def.type === "textarea") {
            return (
              <div key={field.fieldKey} className="space-y-2">
                <FieldLabel
                  htmlFor={field.fieldKey}
                  required={field.required}
                  showOptional={showOptionalLabels}
                >
                  {def.label}
                </FieldLabel>
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
              <FieldLabel
                htmlFor={field.fieldKey}
                required={field.required}
                showOptional={showOptionalLabels}
              >
                {def.label}
              </FieldLabel>
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
              <FieldLabel
                htmlFor={name}
                required={field.required}
                showOptional={showOptionalLabels}
              >
                {field.label}
              </FieldLabel>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.id} className="space-y-2">
              <FieldLabel
                htmlFor={name}
                required={field.required}
                showOptional={showOptionalLabels}
              >
                {field.label}
              </FieldLabel>
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
            <FieldLabel
              htmlFor={name}
              required={field.required}
              showOptional={showOptionalLabels}
            >
              {field.label}
            </FieldLabel>
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
