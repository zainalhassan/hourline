import Link from "next/link";
import { EmptyState } from "@/components/transit/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppNotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This pipeline or item may have been removed."
      className="min-h-[40vh] justify-center"
    >
      <Link href="/" className={cn(buttonVariants())}>
        Back to home
      </Link>
    </EmptyState>
  );
}
