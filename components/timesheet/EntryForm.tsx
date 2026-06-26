"use client";

import { useActionState, useEffect } from "react";
import type { TimeEntry } from "@prisma/client";
import { toast } from "sonner";
import {
  createTimeEntry,
  updateTimeEntry,
  type EntryActionState,
} from "@/actions/entries";
import {
  TIMESHEET_FIELDS,
  type EntryMetadata,
  type TemplateFieldConfig,
} from "@/lib/timesheet/fields";
import { toDateInputValue } from "@/lib/timesheet/periods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EntryFormProps = {
  periodId: string;
  fields: TemplateFieldConfig[];
  entry?: TimeEntry;
  onSuccess?: () => void;
};

const initialState: EntryActionState = {};

function getMeta(entry?: TimeEntry): EntryMetadata {
  return (entry?.metadata as EntryMetadata) ?? {};
}

export function EntryForm({ periodId, fields, entry, onSuccess }: EntryFormProps) {
  const action = entry
    ? updateTimeEntry.bind(null, entry.id)
    : createTimeEntry.bind(null, periodId);

  const [state, formAction, pending] = useActionState(action, initialState);
  const meta = getMeta(entry);
  const visible = fields.filter((f) => f.visible);

  useEffect(() => {
    if (state.success) {
      toast.success(entry ? "Entry updated" : "Entry added");
      onSuccess?.();
    }
  }, [state.success, entry, onSuccess]);

  const defaultDate = entry
    ? toDateInputValue(new Date(entry.entryDate))
    : toDateInputValue(new Date());

  const hours = entry ? Math.floor(entry.durationMinutes / 60) : 0;
  const minutes = entry ? entry.durationMinutes % 60 : 0;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="entryDate">Date</Label>
        <Input
          id="entryDate"
          name="entryDate"
          type="date"
          defaultValue={defaultDate}
          required
        />
      </div>

      {visible.map((field) => {
        const def = TIMESHEET_FIELDS[field.fieldKey];

        if (field.fieldKey === "durationMinutes") {
          return (
            <div key={field.fieldKey} className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="durationHours">Hours</Label>
                <Input
                  id="durationHours"
                  name="durationHours"
                  type="number"
                  min={0}
                  max={24}
                  defaultValue={hours}
                  required={field.required}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Minutes</Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={0}
                  max={59}
                  defaultValue={minutes}
                />
              </div>
            </div>
          );
        }

        if (field.fieldKey === "billable") {
          return (
            <div key={field.fieldKey} className="flex items-center gap-2">
              <input
                id="billable"
                name="billable"
                type="checkbox"
                defaultChecked={meta.billable ?? false}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="billable">{def.label}</Label>
            </div>
          );
        }

        if (def.type === "textarea") {
          return (
            <div key={field.fieldKey} className="space-y-2">
              <Label htmlFor={field.fieldKey}>{def.label}</Label>
              <Textarea
                id={field.fieldKey}
                name={field.fieldKey}
                placeholder={def.placeholder}
                defaultValue={
                  (meta[field.fieldKey as keyof EntryMetadata] as string) ??
                  field.defaultValue ??
                  ""
                }
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
              defaultValue={
                field.fieldKey === "mileage"
                  ? entry?.mileage != null
                    ? String(entry.mileage)
                    : ""
                  : ((meta[field.fieldKey as keyof EntryMetadata] as string) ??
                    field.defaultValue ??
                    "")
              }
              required={field.required}
            />
          </div>
        );
      })}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : entry ? "Update entry" : "Add entry"}
      </Button>
    </form>
  );
}
