import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveUserTemplate } from "@/lib/timesheet/templates";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";
import { EditTemplateForm } from "@/components/templates/EditTemplateForm";
import { PageHeader } from "@/components/transit/PageHeader";
import { SectionCard } from "@/components/transit/SectionCard";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function EditTemplatePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { templateId } = await params;
  const template = await prisma.userTimesheetTemplate.findFirst({
    where: { id: templateId, userId: session.user.id },
  });
  if (!template) notFound();

  const resolved = resolveUserTemplate(template);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit template" description={template.name} />
      <SectionCard title="Field layout" headerColor={resolved.headerColor}>
        <EditTemplateForm
          templateId={template.id}
          initial={{
            name: template.name,
            description: template.description ?? undefined,
            forkedFrom: template.forkedFrom,
            fields: template.fieldConfig as TemplateFieldConfig[],
          }}
        />
      </SectionCard>
    </div>
  );
}
