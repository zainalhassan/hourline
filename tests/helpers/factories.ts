import type { Item, PipelineTemplate, Stage } from "@prisma/client";
import type { StageSnapshot } from "@/lib/templates/syncTypes";

let counter = 0;

export function id(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function stage(overrides: Partial<Stage> & Pick<Stage, "name" | "slug">): Stage {
  return {
    id: id("stage"),
    pipelineId: id("pipeline"),
    sortOrder: 0,
    isEntry: false,
    isTerminal: false,
    isArchived: false,
    color: "#3b82f6",
    ...overrides,
  };
}

export function item(
  overrides: Partial<Item> & {
    currentStage: Stage;
  },
): Item & { currentStage: Stage } {
  const { currentStage, ...rest } = overrides;
  return {
    id: id("item"),
    pipelineId: currentStage.pipelineId,
    title: "Test item",
    subtitle: null,
    notes: null,
    externalUrl: null,
    metadata: null,
    startedAt: new Date(),
    currentStageId: currentStage.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentStage,
    ...rest,
  };
}

export function stageSnapshot(overrides: Partial<StageSnapshot> & Pick<StageSnapshot, "slug" | "name">): StageSnapshot {
  return {
    sortOrder: 0,
    isEntry: false,
    isTerminal: false,
    color: "#3b82f6",
    ...overrides,
  };
}

export function templateEnum(value: PipelineTemplate = "JOB_SEARCH") {
  return value;
}
