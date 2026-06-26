"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { setActiveTemplate, type TemplateActionState } from "@/actions/templates";
import { PRESET_LIST } from "@/lib/timesheet/presets";
import { JobTitlePreset } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ActiveTemplatePickerProps = {
  activePreset: JobTitlePreset;
  activeUserTemplateId: string | null;
  userTemplates: { id: string; name: string; forkedFrom: JobTitlePreset }[];
};

const initialState: TemplateActionState = {};

export function ActiveTemplatePicker({
  activePreset,
  activeUserTemplateId,
  userTemplates,
}: ActiveTemplatePickerProps) {
  const [state, formAction, pending] = useActionState(setActiveTemplate, initialState);

  useEffect(() => {
    if (state.success) toast.success("Active template updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Built-in presets</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESET_LIST.map((preset) => (
            <label
              key={preset.preset}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 hover:bg-muted"
            >
              <input
                type="radio"
                name="preset"
                value={preset.preset}
                defaultChecked={
                  !activeUserTemplateId && activePreset === preset.preset
                }
              />
              <span>
                <span className="block font-medium">{preset.label}</span>
                <span className="text-sm text-muted-foreground">
                  {preset.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {userTemplates.length > 0 && (
        <div className="space-y-2">
          <Label>Your templates</Label>
          <div className="space-y-2">
            {userTemplates.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted"
              >
                <input
                  type="radio"
                  name="userTemplateId"
                  value={t.id}
                  defaultChecked={activeUserTemplateId === t.id}
                />
                <span className="font-medium">{t.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save active template"}
      </Button>
    </form>
  );
}
