import { JobTitlePreset, UserTimesheetTemplate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getDefaultFieldConfig,
  JOB_TITLE_PRESETS,
} from "@/lib/timesheet/presets";
import {
  normalizeFieldConfig,
  type StoredFieldConfig,
  getVisibleResolvedFields,
  type ResolvedField,
} from "@/lib/timesheet/fieldConfig";

export type ActiveTemplate = {
  preset: JobTitlePreset;
  userTemplateId?: string;
  name: string;
  headerColor: string;
  fieldConfig: StoredFieldConfig;
  fields: ResolvedField[];
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
    fieldConfig: getDefaultFieldConfig(preset),
    fields: getVisibleResolvedFields(getDefaultFieldConfig(preset)),
  };
}

export function resolveUserTemplate(template: UserTimesheetTemplate): ActiveTemplate {
  const definition = JOB_TITLE_PRESETS[template.forkedFrom];
  const fieldConfig = normalizeFieldConfig(template.fieldConfig);
  return {
    preset: template.forkedFrom,
    userTemplateId: template.id,
    name: template.name,
    headerColor: definition.headerColor,
    fieldConfig,
    fields: getVisibleResolvedFields(fieldConfig),
  };
}

export function getVisibleFields(fieldConfig: StoredFieldConfig): ResolvedField[] {
  return getVisibleResolvedFields(fieldConfig);
}
