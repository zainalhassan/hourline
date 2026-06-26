export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div className="size-8 animate-pulse rounded-full bg-primary/20" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
