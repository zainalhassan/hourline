import { cn } from "@/lib/utils";

type MobileShellProps = {
  hero: React.ReactNode;
  children: React.ReactNode;
  desktop?: React.ReactNode;
  className?: string;
};

export function MobileShell({ hero, children, desktop, className }: MobileShellProps) {
  return (
    <div className={cn("transit-mobile-shell", className)}>
      <div className="transit-mobile-hero">{hero}</div>
      <div className="transit-mobile-scroll space-y-6 lg:hidden">{children}</div>
      <div className="hidden space-y-6 lg:block">{desktop ?? children}</div>
    </div>
  );
}
