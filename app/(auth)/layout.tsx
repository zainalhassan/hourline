export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 text-center">
        <p className="transit-hero-label">Waypoint</p>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Pipeline tracking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs, grad school, sales, and more — all in one place.
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
