"use server";

import { revalidatePath } from "next/cache";
import { JobTitlePreset } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultFieldConfig } from "@/lib/timesheet/presets";
import type { TemplateFieldConfig } from "@/lib/timesheet/fields";
import {
  createUserTemplateSchema,
  updateActiveTemplateSchema,
  updateUserTemplateSchema,
} from "@/lib/validations";

export type TemplateActionState = {
  error?: string;
  success?: boolean;
};

function parseFieldConfig(formData: FormData): TemplateFieldConfig[] {
  const raw = formData.get("fieldConfig");
  if (typeof raw !== "string") return [];
  try {
    return JSON.parse(raw) as TemplateFieldConfig[];
  } catch {
    return [];
  }
}

export async function setActiveTemplate(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = updateActiveTemplateSchema.safeParse({
    preset: formData.get("preset") || undefined,
    userTemplateId: formData.get("userTemplateId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.userTemplateId) {
    const template = await prisma.userTimesheetTemplate.findFirst({
      where: { id: parsed.data.userTemplateId, userId: session.user.id },
    });
    if (!template) return { error: "Template not found" };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        activeUserTemplateId: template.id,
        activePreset: template.forkedFrom,
      },
    });
  } else if (parsed.data.preset) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        activePreset: parsed.data.preset as JobTitlePreset,
        activeUserTemplateId: null,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/templates");
  return { success: true };
}

export async function createUserTemplate(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createUserTemplateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    forkedFrom: formData.get("forkedFrom"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const fieldConfig =
    parseFieldConfig(formData) ||
    getDefaultFieldConfig(parsed.data.forkedFrom as JobTitlePreset);

  const template = await prisma.userTimesheetTemplate.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      forkedFrom: parsed.data.forkedFrom as JobTitlePreset,
      fieldConfig,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      activeUserTemplateId: template.id,
      activePreset: template.forkedFrom,
    },
  });

  revalidatePath("/templates");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserTemplate(
  templateId: string,
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.userTimesheetTemplate.findFirst({
    where: { id: templateId, userId: session.user.id },
  });
  if (!existing) return { error: "Template not found" };

  const parsed = updateUserTemplateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    forkedFrom: formData.get("forkedFrom"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const fieldConfig = parseFieldConfig(formData);
  if (fieldConfig.length === 0) {
    return { error: "Invalid field configuration" };
  }

  await prisma.userTimesheetTemplate.update({
    where: { id: templateId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      fieldConfig,
    },
  });

  revalidatePath("/templates");
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteUserTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const template = await prisma.userTimesheetTemplate.findFirst({
    where: { id: templateId, userId: session.user.id },
  });
  if (!template) return { error: "Template not found" };

  await prisma.userTimesheetTemplate.delete({ where: { id: templateId } });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  if (user.activeUserTemplateId === templateId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeUserTemplateId: null, activePreset: template.forkedFrom },
    });
  }

  revalidatePath("/templates");
  revalidatePath("/settings");
  return { success: true };
}
