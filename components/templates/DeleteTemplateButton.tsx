"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteUserTemplate } from "@/actions/templates";
import { Button } from "@/components/ui/button";

type DeleteTemplateButtonProps = {
  templateId: string;
};

export function DeleteTemplateButton({ templateId }: DeleteTemplateButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this template?")) return;
    startTransition(async () => {
      const result = await deleteUserTemplate(templateId);
      if (result.error) toast.error(result.error);
      else toast.success("Template deleted");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
