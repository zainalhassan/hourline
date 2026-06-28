"use client";

import { useState, useTransition } from "react";
import type { TimeEntry } from "@prisma/client";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { deleteTimeEntry, duplicateEntry } from "@/actions/entries";
import { EntryForm } from "@/components/timesheet/EntryForm";
import { getVisibleResolvedFields, type StoredFieldConfig } from "@/lib/timesheet/fieldConfig";
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
  fieldConfig: StoredFieldConfig;
  periodId: string;
  dateRange?: {
    min: string;
    max: string;
    default: string;
  };
};

export function EntryActions({ entry, fieldConfig, periodId, dateRange }: EntryActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dupPending, startDup] = useTransition();
  const fields = getVisibleResolvedFields(fieldConfig);

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    await deleteTimeEntry(entry.id);
    setDeleting(false);
  }

  function handleDuplicate() {
    startDup(async () => {
      await duplicateEntry(entry.id);
    });
  }

  return (
    <div className="flex gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
          </DialogHeader>
          <EntryForm
            periodId={periodId}
            fields={fields}
            entry={entry}
            dateRange={dateRange}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleDuplicate}
        disabled={dupPending}
        title="Duplicate row"
      >
        <Copy className="size-4" />
      </Button>
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
