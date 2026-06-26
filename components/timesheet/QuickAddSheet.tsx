"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TimeEntry } from "@prisma/client";
import type { ResolvedField } from "@/lib/timesheet/fieldConfig";
import { EntryForm } from "@/components/timesheet/EntryForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type QuickAddSheetProps = {
  periodId: string;
  fields: ResolvedField[];
  lastEntry: TimeEntry | null;
  canEdit: boolean;
};

export function QuickAddSheet({
  periodId,
  fields,
  lastEntry,
  canEdit,
}: QuickAddSheetProps) {
  const [open, setOpen] = useState(false);

  if (!canEdit) return null;

  return (
    <>
      <div className="fixed bottom-[calc(var(--component-bottom-nav-height)+var(--layout-safe-area-bottom)+1rem)] left-4 right-4 z-20 lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="lg" className="w-full shadow-lg">
                <Plus className="size-5" />
                Log time
              </Button>
            }
          />
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log time</DialogTitle>
            </DialogHeader>
            <EntryForm
              periodId={periodId}
              fields={fields}
              lastEntry={lastEntry}
              compact
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden lg:block">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button size="sm">Quick log</Button>}
          />
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log time</DialogTitle>
            </DialogHeader>
            <EntryForm
              periodId={periodId}
              fields={fields}
              lastEntry={lastEntry}
              compact
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
