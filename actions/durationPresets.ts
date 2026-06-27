"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addHourPreset,
  addMinutePreset,
  canAddHourPreset,
  canAddMinutePreset,
  normalizeDurationPresets,
  removeHourPreset,
  removeMinutePreset,
} from "@/lib/timesheet/durationPresets";

export type DurationPresetActionState = {
  error?: string;
  success?: boolean;
};

async function getUserPresets(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { durationPresets: true },
  });
  return normalizeDurationPresets(user.durationPresets);
}

export async function addDurationHourPreset(
  hours: number,
): Promise<DurationPresetActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const stored = await getUserPresets(session.user.id);
  const error = canAddHourPreset(hours, stored);
  if (error) return { error };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { durationPresets: addHourPreset(stored, hours) },
  });

  revalidatePath("/");
  return { success: true };
}

export async function addDurationMinutePreset(
  minutes: number,
): Promise<DurationPresetActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const stored = await getUserPresets(session.user.id);
  const error = canAddMinutePreset(minutes, stored);
  if (error) return { error };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { durationPresets: addMinutePreset(stored, minutes) },
  });

  revalidatePath("/");
  return { success: true };
}

export async function removeDurationHourPreset(
  hours: number,
): Promise<DurationPresetActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const stored = await getUserPresets(session.user.id);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { durationPresets: removeHourPreset(stored, hours) },
  });

  revalidatePath("/");
  return { success: true };
}

export async function removeDurationMinutePreset(
  minutes: number,
): Promise<DurationPresetActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const stored = await getUserPresets(session.user.id);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { durationPresets: removeMinutePreset(stored, minutes) },
  });

  revalidatePath("/");
  return { success: true };
}
