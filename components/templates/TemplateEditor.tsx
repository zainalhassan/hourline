"use client";

import { useState, type ComponentProps } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { JobTitlePreset } from "@prisma/client";
import { PRESET_LIST } from "@/lib/timesheet/presets";
import type { TemplateFieldConfig, TimesheetFieldKey } from "@/lib/timesheet/fields";
import { TIMESHEET_FIELDS } from "@/lib/timesheet/fields";
import {
  MAX_CUSTOM_FIELDS,
  slugifyCustomFieldId,
  type CustomFieldDefinition,
  type CustomFieldType,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TemplateEditorProps = {
  action: NonNullable<ComponentProps<"form">["action"]>;
  initial?: {
    name: string;
    description?: string;
    forkedFrom: JobTitlePreset;
    fieldConfig: StoredFieldConfig;
  };
  submitLabel: string;
};

export function TemplateEditor({ action, initial, submitLabel }: TemplateEditorProps) {
  const [forkedFrom, setForkedFrom] = useState<JobTitlePreset>(
    initial?.forkedFrom ?? "FIELD_ENGINEER",
  );
  const preset = PRESET_LIST.find((p) => p.preset === forkedFrom)!;
  const [builtIn, setBuiltIn] = useState<TemplateFieldConfig[]>(
    initial?.fieldConfig.builtIn ?? preset.fields.map((f) => ({ ...f })),
  );
  const [custom, setCustom] = useState<CustomFieldDefinition[]>(
    initial?.fieldConfig.custom ?? [],
  );

  const fieldConfig: StoredFieldConfig = { builtIn, custom };

  function updateBuiltIn(key: TimesheetFieldKey, patch: Partial<TemplateFieldConfig>) {
    setBuiltIn((prev) =>
      prev.map((f) => (f.fieldKey === key ? { ...f, ...patch } : f)),
    );
  }

  function moveBuiltIn(key: TimesheetFieldKey, direction: -1 | 1) {
    setBuiltIn((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = sorted.findIndex((f) => f.fieldKey === key);
      const swapIndex = index + direction;
      if (swapIndex < 0 || swapIndex >= sorted.length) return prev;
      const next = [...sorted];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next.map((f, i) => ({ ...f, sortOrder: i }));
    });
  }

  function handlePresetChange(presetKey: JobTitlePreset) {
    setForkedFrom(presetKey);
    const next = PRESET_LIST.find((p) => p.preset === presetKey);
    if (next) setBuiltIn(next.fields.map((f) => ({ ...f })));
  }

  function addCustomField() {
    if (custom.length >= MAX_CUSTOM_FIELDS) return;
    const id = slugifyCustomFieldId("custom");
    setCustom((prev) => [
      ...prev,
      {
        id,
        label: "New column",
        type: "text",
        visible: true,
        required: false,
        sortOrder: builtIn.length + prev.length,
      },
    ]);
  }

  function updateCustom(id: string, patch: Partial<CustomFieldDefinition>) {
    setCustom((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeCustom(id: string) {
    setCustom((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="forkedFrom" value={forkedFrom} />
      <input type="hidden" name="fieldConfig" value={JSON.stringify(fieldConfig)} />

      <div className="space-y-2">
        <Label htmlFor="name">Template name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="My care support sheet"
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
        <Label>Built-in fields</Label>
        {[...builtIn]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((field) => (
            <div
              key={field.fieldKey}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-[120px] flex-1 font-medium">
                  {TIMESHEET_FIELDS[field.fieldKey].label}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveBuiltIn(field.fieldKey, -1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveBuiltIn(field.fieldKey, 1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={field.visible}
                    onChange={(e) =>
                      updateBuiltIn(field.fieldKey, { visible: e.target.checked })
                    }
                  />
                  Visible
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateBuiltIn(field.fieldKey, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Default value</Label>
                <Input
                  value={field.defaultValue ?? ""}
                  onChange={(e) =>
                    updateBuiltIn(field.fieldKey, {
                      defaultValue: e.target.value || undefined,
                    })
                  }
                  placeholder="Optional default when logging"
                />
              </div>
            </div>
          ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Custom columns</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomField}
            disabled={custom.length >= MAX_CUSTOM_FIELDS}
          >
            <Plus className="size-4" />
            Add column
          </Button>
        </div>
        {custom.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add your own columns (e.g. vehicle reg, expense code).
          </p>
        )}
        {custom.map((field) => (
          <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input
                  value={field.label}
                  onChange={(e) => updateCustom(field.id, { label: e.target.value })}
                  placeholder="Column label"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    updateCustom(field.id, { type: value as CustomFieldType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Long text</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeCustom(field.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={field.visible}
                  onChange={(e) =>
                    updateCustom(field.id, { visible: e.target.checked })
                  }
                />
                Visible
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateCustom(field.id, { required: e.target.checked })
                  }
                />
                Required
              </label>
            </div>
            <Input
              value={field.defaultValue ?? ""}
              onChange={(e) =>
                updateCustom(field.id, {
                  defaultValue: e.target.value || undefined,
                })
              }
              placeholder="Default value (optional)"
            />
          </div>
        ))}
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
