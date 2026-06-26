import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroCardProps = {
  headerLabel: string;
  headerColor?: string | null;
  heroLabel: string;
  heroValue: string;
  heroHint?: string;
  meta?: string[];
  selected?: boolean;
  className?: string;
  children?: ReactNode;
};

export function HeroCard({
  headerLabel,
  headerColor,
  heroLabel,
  heroValue,
  heroHint,
  meta,
  selected,
  className,
  children,
}: HeroCardProps) {
  const showHint = heroValue === "—" && heroHint;

  return (
    <div
      className={cn(
        "transit-eta-card",
        selected && "is-selected",
        className,
      )}
    >
      <div
        className="transit-eta-card__header"
        style={{
          backgroundColor: headerColor ?? "var(--color-brand-secondary)",
        }}
      >
        {headerLabel}
      </div>
      <div className="transit-eta-card__body">
        <p className="transit-hero-label">{heroLabel}</p>
        <p className={cn("transit-eta-time", showHint && "text-2xl font-bold")}>
          {showHint ? heroHint : heroValue}
        </p>
        {meta && meta.length > 0 && (
          <div className="transit-eta-card__meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
