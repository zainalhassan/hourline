import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  headerColor?: string;
  className?: string;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  description,
  headerColor,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("transit-eta-card overflow-hidden", className)}>
      <div
        className="transit-eta-card__header"
        style={{ backgroundColor: headerColor ?? "var(--color-brand-secondary)" }}
      >
        {title}
      </div>
      <div className="transit-eta-card__body space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
