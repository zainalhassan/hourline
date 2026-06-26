import { AppNav } from "@/components/layout/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 bg-background px-[var(--layout-page-padding-x)] py-4 pb-[calc(var(--component-bottom-nav-height)+var(--layout-safe-area-bottom)+1rem)] lg:px-4 lg:py-8 lg:pb-8">
        {children}
      </main>
    </>
  );
}
