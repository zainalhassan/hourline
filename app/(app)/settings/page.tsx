import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/user";
import { isEmailConfigured } from "@/lib/env";
import { ActiveTemplatePicker } from "@/components/settings/ActiveTemplatePicker";
import {
  SettingsForm,
  SubmissionSettingsForm,
} from "@/components/settings/SettingsForm";
import { PayScheduleForm } from "@/components/settings/PayScheduleForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { PageHeader } from "@/components/transit/PageHeader";
import { SectionCard } from "@/components/transit/SectionCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/login");

  const userTemplates = await prisma.userTimesheetTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, forkedFrom: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, templates, and submission preferences."
      />

      <SectionCard
        title="Profile"
        headerColor="var(--color-route-blue)"
      >
        <SettingsForm name={user.name ?? ""} email={user.email} />
      </SectionCard>

      <SectionCard
        title="Active template"
        description="Choose a job-title preset or your personal template."
        headerColor="var(--color-route-green)"
      >
        <ActiveTemplatePicker
          activePreset={user.activePreset}
          activeUserTemplateId={user.activeUserTemplateId}
          userTemplates={userTemplates}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/templates" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
            Manage personal templates
          </Link>
        </p>
      </SectionCard>

      <SectionCard
        title="Pay schedule"
        description="How long each timesheet runs and when you get paid."
        headerColor="var(--color-route-teal)"
      >
        <PayScheduleForm
          payPeriodType={user.payPeriodType}
          paydayMode={user.paydayMode}
          paydayOfWeek={user.paydayOfWeek}
          paydayOfMonth={user.paydayOfMonth}
          payPeriodAnchor={user.payPeriodAnchor}
        />
      </SectionCard>

      <SectionCard
        title="Submission"
        description="Where to send your timesheet PDF."
        headerColor="var(--color-route-orange)"
      >
        <SubmissionSettingsForm
          employerName={user.employerName ?? ""}
          employerEmail={user.employerEmail ?? ""}
          ccSelfOnSubmit={user.ccSelfOnSubmit}
          submitMessage={user.submitMessage ?? ""}
          emailConfigured={isEmailConfigured()}
        />
      </SectionCard>

      <SectionCard
        title="Password"
        headerColor="var(--color-route-purple)"
      >
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}
