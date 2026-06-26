import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  headerColor?: string;
  className?: string;
};

export function StatCard({ label, value, headerColor, className }: StatCardProps) {
  return (
    <div className={cn("transit-eta-card overflow-hidden", className)}>
      <div
        className="transit-eta-card__header py-2 text-xs uppercase tracking-wide"
        style={{ backgroundColor: headerColor ?? "var(--color-brand-secondary)" }}
      >
        {label}
      </div>
      <div className="transit-eta-card__body py-4">
        <p className="transit-eta-time text-4xl lg:text-5xl">{value}</p>
      </div>
    </div>
  );
}
