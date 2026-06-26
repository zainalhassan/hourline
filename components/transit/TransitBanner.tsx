import { cn } from "@/lib/utils";

type TransitBannerProps = {
  variant?: "success" | "warning" | "destructive";
  children: React.ReactNode;
  className?: string;
};

export function TransitBanner({
  variant = "success",
  children,
  className,
}: TransitBannerProps) {
  return (
    <div
      className={cn(
        "transit-alert",
        variant === "success" &&
          "border border-[color-mix(in_srgb,var(--color-brand-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)]",
        variant === "warning" && "transit-alert-warning",
        variant === "destructive" && "transit-alert-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}
