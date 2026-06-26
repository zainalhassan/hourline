"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  preparePeriodAction,
  reopenPeriodAction,
  duplicatePreviousWeekAction,
  type PeriodActionState,
} from "@/actions/periods";
import {
  sendTimesheetToEmployer,
  type SubmissionActionState,
} from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SubmissionPanelProps = {
  periodId: string;
  status: "DRAFT" | "READY" | "SENT";
  hasEmployerEmail: boolean;
  emailConfigured: boolean;
  entryCount: number;
  submissions: Array<{
    id: string;
    sentAt: Date;
    recipientEmail: string;
  }>;
};

const periodInitial: PeriodActionState = {};
const sendInitial: SubmissionActionState = {};

export function SubmissionPanel({
  periodId,
  status,
  hasEmployerEmail,
  emailConfigured,
  entryCount,
  submissions,
}: SubmissionPanelProps) {
  const [open, setOpen] = useState(status !== "DRAFT");
  const [dupPending, startDup] = useTransition();
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

  function handleDuplicateWeek() {
    startDup(async () => {
      const result = await duplicatePreviousWeekAction(periodId);
      if (result.success) toast.success("Copied entries from last week");
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <details
      className="rounded-xl border border-border bg-card"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none px-4 py-3 font-semibold marker:content-none">
        Submit timesheet
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          · {status.toLowerCase()}
        </span>
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {status === "DRAFT" && (
            <form action={prepareAction}>
              <Button type="submit" disabled={preparing || entryCount === 0}>
                {preparing ? "Preparing…" : "Mark as ready"}
              </Button>
            </form>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={dupPending || status === "SENT"}
            onClick={handleDuplicateWeek}
          >
            {dupPending ? "Copying…" : "Copy last week"}
          </Button>

          {(status === "READY" || status === "SENT") && (
            <>
              <Button variant="outline" asChild>
                <a href={`/api/periods/${periodId}/pdf`} target="_blank" rel="noreferrer">
                  Preview PDF
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/periods/${periodId}/export`} download>
                  Export CSV
                </a>
              </Button>
            </>
          )}
        </div>

        {(status === "READY" || status === "SENT") && (
          <form action={sendAction} className="flex flex-col gap-3">
            <input type="hidden" name="periodId" value={periodId} />
            <div className="space-y-1">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                name="message"
                rows={2}
                placeholder="Cover note for your employer"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !hasEmployerEmail || !emailConfigured}
              title={
                !hasEmployerEmail
                  ? "Add employer email in Settings"
                  : !emailConfigured
                    ? "SMTP not configured on server"
                    : undefined
              }
            >
              {sending
                ? "Sending…"
                : status === "SENT"
                  ? "Resend to employer"
                  : "Send to employer"}
            </Button>
          </form>
        )}

        {status === "READY" && (
          <Button variant="ghost" onClick={handleReopen}>
            Reopen for editing
          </Button>
        )}

        {!emailConfigured && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Server email is not configured. You can preview or export CSV; see docs/EMAIL.md.
          </p>
        )}

        {hasEmployerEmail && !emailConfigured && status !== "DRAFT" && (
          <p className="text-sm text-muted-foreground">
            Add SMTP settings on the server to enable send.
          </p>
        )}

        {!hasEmployerEmail && status !== "DRAFT" && (
          <p className="text-sm text-muted-foreground">
            Add an employer email in Settings to send this timesheet.
          </p>
        )}

        {submissions.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Submission history</p>
            <ul className="mt-1 space-y-1">
              {submissions.map((s) => (
                <li key={s.id}>
                  Sent to {s.recipientEmail} on{" "}
                  {new Date(s.sentAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
