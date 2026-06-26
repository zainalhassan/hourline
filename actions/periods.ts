"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  markPeriodReady,
  reopenPeriod,
} from "@/lib/timesheet/periodQueries";

export type PeriodActionState = {
  error?: string;
  success?: boolean;
};

export async function preparePeriodAction(
  periodId: string,
  _prev: PeriodActionState,
  _formData: FormData,
): Promise<PeriodActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const result = await markPeriodReady(periodId, session.user.id);
  if (result.error) return { error: result.error };

  revalidatePath("/");
  return { success: true };
}

export async function reopenPeriodAction(
  periodId: string,
): Promise<PeriodActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await reopenPeriod(periodId, session.user.id);
  revalidatePath("/");
  return { success: true };
}
