import { getAppDisplayName } from "@/lib/env";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appName = getAppDisplayName();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 text-center">
        <p className="transit-hero-label">{appName}</p>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Timesheets, your way
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log hours, customise your template, and send a polished PDF to your
          employer.
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
