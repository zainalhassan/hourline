"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  updateSubmissionSettings,
  updateUserSettings,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsFormProps = {
  name: string;
  email: string;
};

const initialState: SettingsActionState = {};

export function SettingsForm({ name, email }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateUserSettings, initialState);

  useEffect(() => {
    if (state.success) toast.success("Profile saved");
  }, [state.success]);

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-muted" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

type SubmissionSettingsFormProps = {
  employerName: string;
  employerEmail: string;
  ccSelfOnSubmit: boolean;
  submitMessage: string;
};

export function SubmissionSettingsForm({
  employerName,
  employerEmail,
  ccSelfOnSubmit,
  submitMessage,
}: SubmissionSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateSubmissionSettings,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success("Submission settings saved");
  }, [state.success]);

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="employerName">Employer name</Label>
        <Input
          id="employerName"
          name="employerName"
          defaultValue={employerName}
          placeholder="Acme Ltd"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employerEmail">Employer email</Label>
        <Input
          id="employerEmail"
          name="employerEmail"
          type="email"
          defaultValue={employerEmail}
          placeholder="payroll@company.com"
        />
        <p className="text-xs text-muted-foreground">
          Used when you send a timesheet PDF from the weekly view.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ccSelfOnSubmit"
          defaultChecked={ccSelfOnSubmit}
          className="size-4 rounded border-border"
        />
        CC me on submission emails
      </label>

      <div className="space-y-2">
        <Label htmlFor="submitMessage">Default message</Label>
        <Textarea
          id="submitMessage"
          name="submitMessage"
          defaultValue={submitMessage}
          placeholder="Please find my timesheet attached."
          rows={3}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save submission settings"}
      </Button>
    </form>
  );
}
