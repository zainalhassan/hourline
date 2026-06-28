"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TimeEntry } from "@prisma/client";
import { toast } from "sonner";
import {
  createTimeEntry,
  updateTimeEntry,
  type EntryActionState,
} from "@/actions/entries";
import type { ResolvedField } from "@/lib/timesheet/fieldConfig";
import type { StoredDurationPresets } from "@/lib/timesheet/durationPresets";
import { getPrefillFromEntry } from "@/lib/timesheet/entryForm";
import { Button } from "@/components/ui/button";
import { EntryFieldInputs } from "@/components/timesheet/EntryFieldInputs";

type EntryFormProps = {
  periodId: string;
  fields: ResolvedField[];
  entry?: TimeEntry;
  lastEntry?: TimeEntry | null;
  onSuccess?: () => void;
  keepOpenOnCreate?: boolean;
  compact?: boolean;
  showSameAsLast?: boolean;
  durationPresets?: StoredDurationPresets;
  dateRange?: {
    min: string;
    max: string;
    default: string;
  };
};

const initialState: EntryActionState = {};

export function EntryForm(props: EntryFormProps) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <EntryFormInner
      key={resetKey}
      {...props}
      onRequestReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function EntryFormInner({
  periodId,
  fields,
  entry,
  lastEntry,
  onSuccess,
  keepOpenOnCreate = false,
  compact = false,
  showSameAsLast = true,
  durationPresets,
  dateRange,
  onRequestReset,
}: EntryFormProps & { onRequestReset: () => void }) {
  const router = useRouter();
  const action = entry
    ? updateTimeEntry.bind(null, entry.id)
    : createTimeEntry.bind(null, periodId);

  const [state, formAction, pending] = useActionState(action, initialState);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [fieldInputsKey, setFieldInputsKey] = useState(0);
  const [hours, setHours] = useState(entry ? Math.floor(entry.durationMinutes / 60) : 1);
  const [minutes, setMinutes] = useState(entry ? entry.durationMinutes % 60 : 0);
  const [showAllFields, setShowAllFields] = useState(!compact || Boolean(entry));

  const handleDurationChange = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
  };

  const quickFieldKeys = new Set(
    fields
      .filter((f) => f.required || (f.kind === "builtIn" && f.fieldKey === "client"))
      .map((f) => (f.kind === "builtIn" ? f.fieldKey : f.id)),
  );

  const clientInQuickView = fields.some(
    (f) => f.kind === "builtIn" && f.fieldKey === "client" && quickFieldKeys.has("client"),
  );

  const visibleFields = showAllFields
    ? fields
    : fields.filter((f) => {
        if (f.kind === "builtIn" && f.fieldKey === "durationMinutes") return true;
        if (f.kind === "builtIn" && f.fieldKey === "notes") return clientInQuickView;
        if (f.kind === "builtIn") return quickFieldKeys.has(f.fieldKey);
        return f.required;
      });

  const hiddenOptionalCount =
    compact && !showAllFields
      ? fields.filter((f) => {
          if (f.kind === "builtIn" && f.fieldKey === "durationMinutes") return false;
          if (f.kind === "builtIn" && f.fieldKey === "notes" && clientInQuickView) return false;
          return !f.required;
        }).length
      : 0;

  useEffect(() => {
    if (!state.success) return;

    toast.success(entry ? "Entry updated" : "Entry added");
    router.refresh();

    if (!entry) {
      if (keepOpenOnCreate) {
        onRequestReset();
      } else {
        onSuccess?.();
      }
      return;
    }

    onSuccess?.();
  }, [state.success, entry, onSuccess, keepOpenOnCreate, onRequestReset, router]);

  function applySameAsLast() {
    if (!lastEntry) return;
    const values = getPrefillFromEntry(lastEntry);
    setPrefill(values);
    setHours(Math.floor(lastEntry.durationMinutes / 60));
    setMinutes(lastEntry.durationMinutes % 60);
    setFieldInputsKey((k) => k + 1);
    toast.message("Filled from your last entry");
  }

  return (
    <form action={formAction} className="space-y-4">
      {dateRange ? (
        <>
          <input type="hidden" name="minDate" value={dateRange.min} />
          <input type="hidden" name="maxDate" value={dateRange.max} />
        </>
      ) : null}

      {!entry && showSameAsLast && lastEntry && (
        <Button type="button" variant="outline" size="sm" onClick={applySameAsLast}>
          Same as last entry
        </Button>
      )}

      <EntryFieldInputs
        key={fieldInputsKey}
        fields={visibleFields}
        entry={entry}
        prefill={prefill}
        compact={compact}
        showOptionalLabels={!compact || showAllFields}
        durationPresets={durationPresets}
        dateMin={dateRange?.min}
        dateMax={dateRange?.max}
        defaultDate={dateRange?.default}
        durationHours={hours}
        durationMinutes={minutes}
        onDurationChange={handleDurationChange}
      />

      {compact && !entry && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAllFields((v) => !v)}
        >
          {showAllFields
            ? "Fewer fields"
            : hiddenOptionalCount > 0
              ? `More fields (${hiddenOptionalCount} optional)`
              : "More fields"}
        </Button>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : entry ? "Update entry" : "Add entry"}
      </Button>
    </form>
  );
}
