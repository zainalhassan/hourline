import { cn } from "@/lib/utils";

type RouteChipProps = {
  label: string;
  color?: string | null;
  className?: string;
};

export function RouteChip({ label, color, className }: RouteChipProps) {
  return (
    <span
      className={cn("route-chip", !color && "bg-muted text-foreground", className)}
      style={color ? { backgroundColor: color } : undefined}
    >
      {label}
    </span>
  );
}
