import Link from "next/link";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground lg:text-base">{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}
