import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getAppDisplayName } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  return (
    <OnboardingWizard
      appName={getAppDisplayName()}
      name={user.name ?? ""}
      email={user.email}
      activePreset={user.activePreset}
      payPeriodType={user.payPeriodType}
      paydayMode={user.paydayMode}
      paydayOfWeek={user.paydayOfWeek}
      paydayOfMonth={user.paydayOfMonth}
      payPeriodAnchor={user.payPeriodAnchor}
      payTimingMode={user.payTimingMode}
      periodCloseMode={user.periodCloseMode}
      periodCloseDayOfMonth={user.periodCloseDayOfMonth}
      periodCloseDaysBeforePayday={user.periodCloseDaysBeforePayday}
    />
  );
}
