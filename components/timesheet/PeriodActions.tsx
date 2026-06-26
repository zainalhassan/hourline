"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  preparePeriodAction,
  reopenPeriodAction,
  type PeriodActionState,
} from "@/actions/periods";
import {
  sendTimesheetToEmployer,
  type SubmissionActionState,
} from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PeriodActionsProps = {
  periodId: string;
  status: "DRAFT" | "READY" | "SENT";
  hasEmployerEmail: boolean;
  entryCount: number;
};

const periodInitial: PeriodActionState = {};
const sendInitial: SubmissionActionState = {};

export function PeriodActions({
  periodId,
  status,
  hasEmployerEmail,
  entryCount,
}: PeriodActionsProps) {
  const [prepareState, prepareAction, preparing] = useActionState(
    preparePeriodAction.bind(null, periodId),
    periodInitial,
  );
  const [sendState, sendAction, sending] = useActionState(
    sendTimesheetToEmployer,
    sendInitial,
  );

  useEffect(() => {
    if (prepareState.success) toast.success("Timesheet marked as ready");
    if (prepareState.error) toast.error(prepareState.error);
  }, [prepareState]);

  useEffect(() => {
    if (sendState.success) toast.success("Timesheet sent to employer");
    if (sendState.error) toast.error(sendState.error);
  }, [sendState]);

  async function handleReopen() {
    const result = await reopenPeriodAction(periodId);
    if (result.success) toast.success("Timesheet reopened for editing");
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <form action={prepareAction}>
            <Button type="submit" disabled={preparing || entryCount === 0}>
              {preparing ? "Preparing…" : "Mark as ready"}
            </Button>
          </form>
        )}

        {(status === "READY" || status === "SENT") && (
          <Button variant="outline" asChild>
            <a href={`/api/periods/${periodId}/pdf`} target="_blank" rel="noreferrer">
              Preview PDF
            </a>
          </Button>
        )}

        {status === "READY" && (
          <form action={sendAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="periodId" value={periodId} />
            <div className="space-y-1">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                name="message"
                rows={2}
                placeholder="Cover note for your employer"
                className="min-w-[240px]"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !hasEmployerEmail}
              title={!hasEmployerEmail ? "Add employer email in Settings" : undefined}
            >
              {sending ? "Sending…" : "Send to employer"}
            </Button>
          </form>
        )}

        {status === "READY" && (
          <Button variant="ghost" onClick={handleReopen}>
            Reopen for editing
          </Button>
        )}
      </div>

      {status === "READY" && !hasEmployerEmail && (
        <p className="text-sm text-muted-foreground">
          Add an employer email in Settings to send this timesheet.
        </p>
      )}
    </div>
  );
}
