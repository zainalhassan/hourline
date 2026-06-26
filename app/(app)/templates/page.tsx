import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresetLabel } from "@/lib/timesheet/presets";
import { PageHeader } from "@/components/transit/PageHeader";
import { EmptyState } from "@/components/transit/EmptyState";
import { HeroCard } from "@/components/transit/HeroCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteTemplateButton } from "@/components/templates/DeleteTemplateButton";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const templates = await prisma.userTimesheetTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="My templates"
        description="Personal layouts forked from job-title presets."
      >
        <Link href="/templates/new" className={cn(buttonVariants())}>
          New template
        </Link>
      </PageHeader>

      {templates.length === 0 ? (
        <EmptyState
          title="No personal templates yet"
          description="Fork a job-title preset and fine-tune which fields appear on your timesheet."
        >
          <Link href="/templates/new" className={cn(buttonVariants())}>
            Create template
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((template, index) => (
            <div key={template.id} className="space-y-2">
              <HeroCard
                headerLabel={template.name}
                headerColor={`var(--color-route-${["blue", "green", "purple", "orange", "cyan"][index % 5]})`}
                heroLabel="Based on"
                heroValue={getPresetLabel(template.forkedFrom)}
                meta={template.description ? [template.description] : undefined}
              />
              <div className="flex gap-2">
                <Link
                  href={`/templates/${template.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
                <DeleteTemplateButton templateId={template.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
