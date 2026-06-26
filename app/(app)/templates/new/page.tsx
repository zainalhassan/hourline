"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useActionState } from "react";
import { createUserTemplate, type TemplateActionState } from "@/actions/templates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { PageHeader } from "@/components/transit/PageHeader";
import { SectionCard } from "@/components/transit/SectionCard";

const initialState: TemplateActionState = {};

export default function NewTemplatePage() {
  const router = useRouter();
  const [state, formAction] = useActionState(createUserTemplate, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Template created");
      router.push("/templates");
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New template"
        description="Fork a job-title preset and customise your fields."
      />
      <SectionCard title="Template details" headerColor="var(--color-route-blue)">
        <TemplateEditor action={formAction} submitLabel="Create template" />
      </SectionCard>
    </div>
  );
}
