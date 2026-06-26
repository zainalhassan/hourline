import { JobTitlePreset, UserTimesheetTemplate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getDefaultFieldConfig,
  JOB_TITLE_PRESETS,
} from "@/lib/timesheet/presets";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";

export type ActiveTemplate = {
  preset: JobTitlePreset;
  userTemplateId?: string;
  name: string;
  headerColor: string;
  fields: TemplateFieldConfig[];
};

export async function getUserActiveTemplate(userId: string): Promise<ActiveTemplate> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      activePreset: true,
      activeUserTemplateId: true,
    },
  });

  if (user.activeUserTemplateId) {
    const template = await prisma.userTimesheetTemplate.findFirst({
      where: { id: user.activeUserTemplateId, userId },
    });
    if (template) {
      return resolveUserTemplate(template);
    }
  }

  const preset = user.activePreset;
  const definition = JOB_TITLE_PRESETS[preset];
  return {
    preset,
    name: definition.label,
    headerColor: definition.headerColor,
    fields: getDefaultFieldConfig(preset),
  };
}

export function resolveUserTemplate(template: UserTimesheetTemplate): ActiveTemplate {
  const definition = JOB_TITLE_PRESETS[template.forkedFrom];
  const fields = template.fieldConfig as TemplateFieldConfig[];
  return {
    preset: template.forkedFrom,
    userTemplateId: template.id,
    name: template.name,
    headerColor: definition.headerColor,
    fields: [...fields].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function getVisibleFields(fields: TemplateFieldConfig[]): TemplateFieldConfig[] {
  return fields.filter((f) => f.visible).sort((a, b) => a.sortOrder - b.sortOrder);
}
