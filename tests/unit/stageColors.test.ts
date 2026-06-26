import { describe, expect, it } from "vitest";
import { buildStagesFromInput } from "@/lib/pipelines/stageColors";

describe("buildStagesFromInput", () => {
  it("assigns sort order and slugs", () => {
    const stages = buildStagesFromInput([
      { name: "Applied", isEntry: true },
      { name: "Interview" },
      { name: "Offer", isTerminal: true },
    ]);

    expect(stages).toHaveLength(3);
    expect(stages[0]).toMatchObject({ slug: "applied", sortOrder: 0, isEntry: true });
    expect(stages[2]).toMatchObject({ slug: "offer", isTerminal: true });
  });

  it("defaults first stage to entry", () => {
    const stages = buildStagesFromInput([{ name: "Start" }, { name: "End" }]);
    expect(stages[0].isEntry).toBe(true);
    expect(stages[1].isEntry).toBe(false);
  });

  it("cycles colors from palette", () => {
    const stages = buildStagesFromInput([
      { name: "A" },
      { name: "B" },
    ]);
    expect(stages[0].color).toBeTruthy();
    expect(stages[1].color).toBeTruthy();
    expect(stages[0].color).not.toBe(stages[1].color);
  });
});
