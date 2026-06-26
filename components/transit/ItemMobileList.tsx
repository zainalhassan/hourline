import Link from "next/link";
import type { Item, PipelineTemplate, Stage } from "@prisma/client";
import { getItemHeroMetric } from "@/lib/items/formatMetadata";
import { HeroCard } from "@/components/transit/HeroCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ItemMobileListProps = {
  pipelineId: string;
  template: PipelineTemplate;
  items: (Item & { currentStage: Stage })[];
};

export function ItemMobileList({ pipelineId, template, items }: ItemMobileListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed p-8 text-center lg:hidden">
        <p className="font-medium">No items yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first application or opportunity to start tracking progress.
        </p>
        <Link
          href={`/pipelines/${pipelineId}/items/new`}
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          Add your first item
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:hidden">
      {items.map((item) => {
        const metric = getItemHeroMetric(template, item.metadata);
        return (
          <Link
            key={item.id}
            href={`/pipelines/${pipelineId}/items/${item.id}`}
            className="block transition-transform active:scale-[0.99]"
          >
            <HeroCard
              headerLabel={item.currentStage.name}
              headerColor={item.currentStage.color}
              heroLabel={metric.label}
              heroValue={metric.value}
              heroHint={metric.fallback}
              meta={[
                item.title,
                ...(item.subtitle ? [item.subtitle] : []),
                `Started ${item.startedAt.toLocaleDateString()}`,
              ]}
            />
          </Link>
        );
      })}
    </div>
  );
}
