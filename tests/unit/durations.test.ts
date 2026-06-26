import { describe, expect, it } from "vitest";
import {
  computeAvgTimeToTerminal,
  computeFunnelDropOffs,
  computeStageDurations,
} from "@/lib/analytics/durations";
import { item, stage } from "../helpers/factories";

describe("duration analytics", () => {
  const applied = stage({ slug: "applied", name: "Applied", sortOrder: 0 });
  const interview = stage({
    slug: "interview",
    name: "Interview",
    sortOrder: 1,
    isTerminal: false,
  });
  const offer = stage({
    slug: "offer",
    name: "Offer",
    sortOrder: 2,
    isTerminal: true,
  });

  it("computes average days in each stage", () => {
    const started = new Date("2026-01-01");
    const mid = new Date("2026-01-11");
    const end = new Date("2026-01-21");

    const items = [
      {
        ...item({ title: "A", currentStage: offer }),
        stageEvents: [
          {
            id: "e1",
            itemId: "i1",
            fromStageId: null,
            toStageId: applied.id,
            occurredAt: started,
            fromStage: null,
            toStage: applied,
          },
          {
            id: "e2",
            itemId: "i1",
            fromStageId: applied.id,
            toStageId: interview.id,
            occurredAt: mid,
            fromStage: applied,
            toStage: interview,
          },
          {
            id: "e3",
            itemId: "i1",
            fromStageId: interview.id,
            toStageId: offer.id,
            occurredAt: end,
            fromStage: interview,
            toStage: offer,
          },
        ],
      },
    ];

    const durations = computeStageDurations(items, [applied, interview, offer]);
    const appliedStat = durations.find((d) => d.slug === "applied");
    expect(appliedStat?.avgDays).toBe(10);
    expect(appliedStat?.sampleCount).toBe(1);
  });

  it("counts funnel transitions", () => {
    const events = [
      {
        id: "e1",
        itemId: "i1",
        fromStageId: applied.id,
        toStageId: interview.id,
        occurredAt: new Date(),
        fromStage: applied,
        toStage: interview,
      },
      {
        id: "e2",
        itemId: "i2",
        fromStageId: applied.id,
        toStageId: interview.id,
        occurredAt: new Date(),
        fromStage: applied,
        toStage: interview,
      },
    ];

    const dropOffs = computeFunnelDropOffs(events);
    expect(dropOffs).toHaveLength(1);
    expect(dropOffs[0]?.count).toBe(2);
    expect(dropOffs[0]?.fromStage).toBe("Applied");
  });

  it("computes average time to terminal stage", () => {
    const start = new Date("2026-01-01");
    const terminal = new Date("2026-01-31");

    const items = [
      {
        ...item({ title: "Done", currentStage: offer }),
        stageEvents: [
          {
            id: "e1",
            itemId: "i1",
            fromStageId: null,
            toStageId: applied.id,
            occurredAt: start,
            fromStage: null,
            toStage: applied,
          },
          {
            id: "e2",
            itemId: "i1",
            fromStageId: applied.id,
            toStageId: offer.id,
            occurredAt: terminal,
            fromStage: applied,
            toStage: offer,
          },
        ],
      },
    ];

    expect(computeAvgTimeToTerminal(items)).toBe(30);
  });
});
