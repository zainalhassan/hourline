import { cn } from "@/lib/utils";

type FilterPanelProps = {
  title?: string;
  className?: string;
  children: React.ReactNode;
  collapsibleOnMobile?: boolean;
};

export function FilterPanel({
  title = "Filters",
  className,
  children,
  collapsibleOnMobile = true,
}: FilterPanelProps) {
  if (collapsibleOnMobile) {
    return (
      <>
        <details className={cn("transit-eta-card lg:hidden", className)}>
          <summary className="transit-eta-card__header cursor-pointer list-none py-3 [&::-webkit-details-marker]:hidden">
            {title}
          </summary>
          <div className="transit-eta-card__body space-y-4 border-t border-border">
            {children}
          </div>
        </details>
        <div
          className={cn(
            "transit-eta-card hidden overflow-hidden lg:block",
            className,
          )}
        >
          <div
            className="transit-eta-card__header py-3"
            style={{ backgroundColor: "var(--color-brand-secondary)" }}
          >
            {title}
          </div>
          <div className="transit-eta-card__body flex flex-wrap items-end gap-4">
            {children}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={cn("transit-eta-card overflow-hidden", className)}>
      <div
        className="transit-eta-card__header py-3"
        style={{ backgroundColor: "var(--color-brand-secondary)" }}
      >
        {title}
      </div>
      <div className="transit-eta-card__body flex flex-wrap items-end gap-4">
        {children}
      </div>
    </div>
  );
}
