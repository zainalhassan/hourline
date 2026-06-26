"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { updateUserTemplate, type TemplateActionState } from "@/actions/templates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { JobTitlePreset } from "@prisma/client";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";

type EditTemplateFormProps = {
  templateId: string;
  initial: {
    name: string;
    description?: string;
    forkedFrom: JobTitlePreset;
    fields: TemplateFieldConfig[];
  };
};

const initialState: TemplateActionState = {};

export function EditTemplateForm({ templateId, initial }: EditTemplateFormProps) {
  const router = useRouter();
  const action = updateUserTemplate.bind(null, templateId);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Template saved");
      router.push("/templates");
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  return (
    <TemplateEditor
      action={formAction}
      initial={initial}
      submitLabel="Save changes"
    />
  );
}
