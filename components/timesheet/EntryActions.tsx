"use client";

import { useState } from "react";
import type { TimeEntry } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTimeEntry } from "@/actions/entries";
import { EntryForm } from "@/components/timesheet/EntryForm";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EntryActionsProps = {
  entry: TimeEntry;
  fields: TemplateFieldConfig[];
  periodId: string;
};

export function EntryActions({ entry, fields, periodId }: EntryActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    await deleteTimeEntry(entry.id);
    setDeleting(false);
  }

  return (
    <div className="flex gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8" />
          }
        >
          <Pencil className="size-4" />
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
          </DialogHeader>
          <EntryForm
            periodId={periodId}
            fields={fields}
            entry={entry}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
