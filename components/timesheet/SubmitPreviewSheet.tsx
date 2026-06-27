"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import type { PeriodStatus } from "@prisma/client";
import { reopenPeriodAction } from "@/actions/periods";
import {
  sendTimesheetToEmployer,
  type SubmissionActionState,
} from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getIncompletePeriodWarning } from "@/lib/timesheet/submissionScope";

type SubmitPreviewSheetProps = {
  periodId: string;
  status: PeriodStatus;
  scopeLabel: string;
  hasEmployerEmail: boolean;
  emailConfigured: boolean;
  entryCount: number;
  periodComplete: boolean;
  periodEnd?: Date;
  trigger: React.ReactElement;
};

const sendInitial: SubmissionActionState = {};

export function SubmitPreviewSheet({
  periodId,
  status,
  scopeLabel,
  hasEmployerEmail,
  emailConfigured,
  entryCount,
  periodComplete,
  periodEnd,
  trigger,
}: SubmitPreviewSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [sendState, sendAction, sending] = useActionState(
    sendTimesheetToEmployer,
    sendInitial,
  );

  useEffect(() => {
    if (sendState.success) {
      toast.success("Timesheet sent to employer");
      setOpen(false);
      router.refresh();
    }
    if (sendState.error) toast.error(sendState.error);
  }, [sendState, router]);

  async function handleMakeChanges() {
    if (status === "READY" || status === "SENT") {
      setReopening(true);
      const result = await reopenPeriodAction(periodId);
      setReopening(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Reopened for editing");
      router.refresh();
    }
    setOpen(false);
  }

  const sendDisabled =
    !hasEmployerEmail ||
    !emailConfigured ||
    entryCount === 0 ||
    !periodComplete ||
    sending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        showCloseButton
        className="flex h-[min(90vh,820px)] max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <DialogTitle>Review timesheet</DialogTitle>
          <p className="text-sm text-muted-foreground">{scopeLabel}</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-muted/30">
          {open ? (
            <iframe
              title="Timesheet preview"
              src={`/api/periods/${periodId}/pdf`}
              className="h-full w-full border-0 bg-white"
            />
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border bg-background p-4">
          <form action={sendAction} className="space-y-3">
            <input type="hidden" name="periodId" value={periodId} />
            <div className="space-y-1">
              <Label htmlFor="preview-send-message">Message (optional)</Label>
              <Textarea
                id="preview-send-message"
                name="message"
                rows={2}
                placeholder="Cover note for your employer"
              />
            </div>

            {!hasEmployerEmail ? (
              <p className="text-sm text-muted-foreground">
                Add an employer email in Settings to send.
              </p>
            ) : null}
            {!emailConfigured ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Server email is not configured. You can still preview and export from the submit panel.
              </p>
            ) : null}
            {!periodComplete && periodEnd ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {getIncompletePeriodWarning(periodEnd)}
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={reopening}
                onClick={handleMakeChanges}
              >
                <Pencil className="size-4" />
                {reopening ? "Reopening…" : "Make changes"}
              </Button>
              <Button type="submit" className="flex-1" disabled={sendDisabled}>
                <Send className="size-4" />
                {sending
                  ? "Sending…"
                  : status === "SENT"
                    ? "Resend"
                    : "Send to employer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
