"use client";

import { useState } from "react";
import { JobTitlePreset } from "@prisma/client";
import { PRESET_LIST } from "@/lib/timesheet/presets";
import {
  TIMESHEET_FIELDS,
  type TemplateFieldConfig,
  type TimesheetFieldKey,
} from "@/lib/timesheet/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TemplateEditorProps = {
  action: (
    prev: { error?: string; success?: boolean },
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  initial?: {
    name: string;
    description?: string;
    forkedFrom: JobTitlePreset;
    fields: TemplateFieldConfig[];
  };
  submitLabel: string;
};

export function TemplateEditor({ action, initial, submitLabel }: TemplateEditorProps) {
  const [forkedFrom, setForkedFrom] = useState<JobTitlePreset>(
    initial?.forkedFrom ?? "FIELD_ENGINEER",
  );
  const preset = PRESET_LIST.find((p) => p.preset === forkedFrom)!;
  const [fields, setFields] = useState<TemplateFieldConfig[]>(
    initial?.fields ?? preset.fields,
  );

  function updateField(key: TimesheetFieldKey, patch: Partial<TemplateFieldConfig>) {
    setFields((prev) =>
      prev.map((f) => (f.fieldKey === key ? { ...f, ...patch } : f)),
    );
  }

  function handlePresetChange(presetKey: JobTitlePreset) {
    setForkedFrom(presetKey);
    const next = PRESET_LIST.find((p) => p.preset === presetKey);
    if (next) setFields(next.fields.map((f) => ({ ...f })));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="forkedFrom" value={forkedFrom} />
      <input type="hidden" name="fieldConfig" value={JSON.stringify(fields)} />

      <div className="space-y-2">
        <Label htmlFor="name">Template name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="My field engineer sheet"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description}
          placeholder="Optional notes about this layout"
        />
      </div>

      {!initial && (
        <div className="space-y-2">
          <Label>Start from preset</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESET_LIST.map((p) => (
              <button
                key={p.preset}
                type="button"
                onClick={() => handlePresetChange(p.preset)}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  forkedFrom === p.preset
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium">{p.label}</p>
                <p className="text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label>Fields</Label>
        {fields.map((field) => (
          <div
            key={field.fieldKey}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
          >
            <p className="min-w-[140px] font-medium">
              {TIMESHEET_FIELDS[field.fieldKey].label}
            </p>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={field.visible}
                onChange={(e) => updateField(field.fieldKey, { visible: e.target.checked })}
              />
              Visible
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.fieldKey, { required: e.target.checked })}
              />
              Required
            </label>
          </div>
        ))}
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
