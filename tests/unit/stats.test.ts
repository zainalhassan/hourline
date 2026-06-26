import { describe, expect, it } from "vitest";
import { computePipelineStats } from "@/lib/sankey/stats";
import { item, stage } from "../helpers/factories";

describe("computePipelineStats", () => {
  it("computes job search conversion rate", () => {
    const applied = stage({ slug: "applied", name: "Applied" });
    const interview = stage({ slug: "interview", name: "Interview" });
    const rejected = stage({ slug: "rejected", name: "Rejected", isTerminal: true });

    const stats = computePipelineStats(
      [
        item({ currentStage: applied }),
        item({ currentStage: interview }),
        item({ currentStage: rejected }),
      ],
      "JOB_SEARCH",
    );

    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.terminal).toBe(1);
    expect(stats.conversionRate).toBe(33);
    expect(stats.conversionLabel).toBe("Reached interview");
  });

  it("excludes items in archived stages from totals", () => {
    const applied = stage({ slug: "applied", name: "Applied" });
    const archived = stage({
      slug: "in-progress",
      name: "In progress (removed)",
      isArchived: true,
    });

    const stats = computePipelineStats(
      [item({ currentStage: applied }), item({ currentStage: archived })],
      "JOB_SEARCH",
    );

    expect(stats.total).toBe(1);
    expect(stats.active).toBe(1);
  });

  it("computes investment active holdings rate", () => {
    const holding = stage({ slug: "holding", name: "Holding" });
    const researching = stage({ slug: "researching", name: "Researching" });

    const stats = computePipelineStats(
      [item({ currentStage: holding }), item({ currentStage: researching })],
      "INVESTMENTS",
    );

    expect(stats.conversionLabel).toBe("Active holdings");
    expect(stats.conversionRate).toBe(50);
  });
});
