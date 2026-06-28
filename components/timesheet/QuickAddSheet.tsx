"use client";

import { useState } from "react";
import { Plus, Send } from "lucide-react";
import type { TimeEntry } from "@prisma/client";
import type { PeriodStatus } from "@prisma/client";
import type { ResolvedField } from "@/lib/timesheet/fieldConfig";
import type { StoredDurationPresets } from "@/lib/timesheet/durationPresets";
import { EntryForm } from "@/components/timesheet/EntryForm";
import { SubmitPreviewSheet } from "@/components/timesheet/SubmitPreviewSheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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
  durationPresets: StoredDurationPresets;
  dateRange: {
    min: string;
    max: string;
    default: string;
  };
  submission?: {
    periodId: string;
    status: PeriodStatus;
    scopeLabel: string;
    hasEmployerEmail: boolean;
    emailConfigured: boolean;
    entryCount: number;
    periodComplete: boolean;
    periodEnd?: Date;
  };
};

function QuickLogDialog({
  periodId,
  fields,
  lastEntry,
  durationPresets,
  dateRange,
  trigger,
  dialogClassName,
}: {
  periodId: string;
  fields: ResolvedField[];
  lastEntry: TimeEntry | null;
  durationPresets: StoredDurationPresets;
  dateRange: QuickAddSheetProps["dateRange"];
  trigger: React.ReactElement;
  dialogClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSessionKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent
        className={
          dialogClassName ?? "max-h-[85vh] overflow-y-auto sm:max-w-md"
        }
      >
        <DialogHeader>
          <DialogTitle>Log time</DialogTitle>
        </DialogHeader>
        {open ? (
          <EntryForm
            key={sessionKey}
            periodId={periodId}
            fields={fields}
            lastEntry={lastEntry}
            compact
            keepOpenOnCreate
            durationPresets={durationPresets}
            dateRange={dateRange}
          />
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="w-full sm:w-auto" />}>
            Done
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickAddSheet({
  periodId,
  fields,
  lastEntry,
  canEdit,
  durationPresets,
  dateRange,
  submission,
}: QuickAddSheetProps) {
  const showLogButton = canEdit;

  if (!canEdit && !submission) return null;

  return (
    <>
      <div className="fixed bottom-[calc(var(--component-bottom-nav-height)+var(--layout-safe-area-bottom)+1rem)] left-4 right-4 z-20 flex gap-2 lg:hidden">
        {showLogButton ? (
          <QuickLogDialog
            periodId={periodId}
            fields={fields}
            lastEntry={lastEntry}
            durationPresets={durationPresets}
            dateRange={dateRange}
            trigger={
              <Button size="lg" className="min-w-0 flex-1 shadow-lg">
                <Plus className="size-5" />
                Log time
              </Button>
            }
          />
        ) : null}
        {submission ? (
          <SubmitPreviewSheet
            periodId={submission.periodId}
            status={submission.status}
            scopeLabel={submission.scopeLabel}
            hasEmployerEmail={submission.hasEmployerEmail}
            emailConfigured={submission.emailConfigured}
            entryCount={submission.entryCount}
            periodComplete={submission.periodComplete}
            periodEnd={submission.periodEnd}
            trigger={
              <Button
                size="lg"
                variant="outline"
                className="min-w-0 flex-1 bg-background shadow-lg"
                disabled={submission.entryCount === 0}
              >
                <Send className="size-5" />
                Submit
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="hidden items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex">
        <p className="max-w-xl text-sm text-muted-foreground">
          {showLogButton
            ? "Add entries with Log time, then review and send when your period is ready."
            : "Your timesheet is locked for editing. Review and send when ready."}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {showLogButton ? (
            <QuickLogDialog
              periodId={periodId}
              fields={fields}
              lastEntry={lastEntry}
              durationPresets={durationPresets}
              dateRange={dateRange}
              dialogClassName="max-h-[85vh] overflow-y-auto sm:max-w-lg"
              trigger={
                <Button size="lg" className="min-w-36 gap-2 px-6">
                  <Plus className="size-5" />
                  Log time
                </Button>
              }
            />
          ) : null}
          {submission ? (
            <SubmitPreviewSheet
              periodId={submission.periodId}
              status={submission.status}
              scopeLabel={submission.scopeLabel}
              hasEmployerEmail={submission.hasEmployerEmail}
              emailConfigured={submission.emailConfigured}
              entryCount={submission.entryCount}
              periodComplete={submission.periodComplete}
              periodEnd={submission.periodEnd}
              trigger={
                <Button
                  size="lg"
                  className="min-w-36 gap-2 px-6"
                  disabled={submission.entryCount === 0}
                >
                  <Send className="size-5" />
                  Submit timesheet
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
