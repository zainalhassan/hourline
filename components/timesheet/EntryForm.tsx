"use client";

import { useActionState, useEffect, useState } from "react";
import type { TimeEntry } from "@prisma/client";
import { toast } from "sonner";
import {
  createTimeEntry,
  updateTimeEntry,
  type EntryActionState,
} from "@/actions/entries";
import type { ResolvedField } from "@/lib/timesheet/fieldConfig";
import { getPrefillFromEntry } from "@/lib/timesheet/entryForm";
import { Button } from "@/components/ui/button";
import { EntryFieldInputs } from "@/components/timesheet/EntryFieldInputs";

type EntryFormProps = {
  periodId: string;
  fields: ResolvedField[];
  entry?: TimeEntry;
  lastEntry?: TimeEntry | null;
  onSuccess?: () => void;
  compact?: boolean;
  showSameAsLast?: boolean;
};

const initialState: EntryActionState = {};

export function EntryForm({
  periodId,
  fields,
  entry,
  lastEntry,
  onSuccess,
  compact = false,
  showSameAsLast = true,
}: EntryFormProps) {
  const action = entry
    ? updateTimeEntry.bind(null, entry.id)
    : createTimeEntry.bind(null, periodId);

  const [state, formAction, pending] = useActionState(action, initialState);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [hours, setHours] = useState(entry ? Math.floor(entry.durationMinutes / 60) : 1);
  const [minutes, setMinutes] = useState(entry ? entry.durationMinutes % 60 : 0);
  const [showAllFields, setShowAllFields] = useState(!compact || Boolean(entry));

  const quickFieldKeys = new Set(
    fields
      .filter((f) => f.required || (f.kind === "builtIn" && f.fieldKey === "client"))
      .map((f) => (f.kind === "builtIn" ? f.fieldKey : f.id)),
  );

  const visibleFields = showAllFields
    ? fields
    : fields.filter((f) => {
        if (f.kind === "builtIn" && f.fieldKey === "durationMinutes") return true;
        if (f.kind === "builtIn") return quickFieldKeys.has(f.fieldKey);
        return f.required;
      });

  useEffect(() => {
    if (state.success) {
      toast.success(entry ? "Entry updated" : "Entry added");
      onSuccess?.();
    }
  }, [state.success, entry, onSuccess]);

  function applySameAsLast() {
    if (!lastEntry) return;
    const values = getPrefillFromEntry(lastEntry);
    setPrefill(values);
    setHours(Math.floor(lastEntry.durationMinutes / 60));
    setMinutes(lastEntry.durationMinutes % 60);
    toast.message("Filled from your last entry");
  }

  return (
    <form action={formAction} className="space-y-4">
      {!entry && showSameAsLast && lastEntry && (
        <Button type="button" variant="outline" size="sm" onClick={applySameAsLast}>
          Same as last entry
        </Button>
      )}

      <EntryFieldInputs
        fields={visibleFields}
        entry={entry}
        prefill={prefill}
        compact={compact}
        durationHours={hours}
        durationMinutes={minutes}
        onDurationChange={
          compact
            ? (h, m) => {
                setHours(h);
                setMinutes(m);
              }
            : undefined
        }
      />

      {compact && !entry && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAllFields((v) => !v)}
        >
          {showAllFields ? "Fewer fields" : "More fields"}
        </Button>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : entry ? "Update entry" : "Add entry"}
      </Button>
    </form>
  );
}
