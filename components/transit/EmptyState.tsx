import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({ title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "transit-eta-card border-dashed bg-muted/10 px-6 py-10 text-center shadow-none",
        className,
      )}
    >
      <p className="text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-4 flex flex-col items-center gap-2">{children}</div>}
    </div>
  );
}
