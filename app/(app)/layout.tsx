import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { auth } from "@/lib/auth";
import { needsOnboarding } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompletedAt: true },
    });
    if (needsOnboarding(user)) {
      redirect("/onboarding");
    }
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 bg-background px-[var(--layout-page-padding-x)] py-4 pb-[calc(var(--component-bottom-nav-height)+var(--layout-safe-area-bottom)+1rem)] lg:px-4 lg:py-8 lg:pb-8">
        {children}
      </main>
    </>
  );
}
