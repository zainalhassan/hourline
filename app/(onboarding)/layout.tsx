import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAppDisplayName } from "@/lib/env";
import { needsOnboarding } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  if (!needsOnboarding(user)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/20 px-[var(--layout-page-padding-x)] py-8 pb-[calc(var(--layout-safe-area-bottom)+2rem)]">
      {children}
    </div>
  );
}
