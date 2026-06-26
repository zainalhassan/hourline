import { describe, expect, it } from "vitest";
import { filterAndSortItems } from "@/lib/pipelines/itemFilters";
import { item, stage } from "../helpers/factories";

describe("filterAndSortItems", () => {
  const applied = stage({ slug: "applied", name: "Applied", sortOrder: 0 });
  const interview = stage({ slug: "interview", name: "Interview", sortOrder: 1 });

  const items = [
    {
      ...item({
        id: "1",
        title: "Engineer @ Acme",
        currentStage: applied,
        metadata: { company: "Acme" },
      }),
      updatedAt: new Date("2026-06-01"),
      startedAt: new Date("2026-05-01"),
    },
    {
      ...item({
        id: "2",
        title: "Designer @ Beta",
        currentStage: interview,
        metadata: { company: "Beta" },
      }),
      updatedAt: new Date("2026-06-10"),
      startedAt: new Date("2026-05-15"),
    },
  ];

  it("filters by search query", () => {
    const result = filterAndSortItems(items, { sort: "updated", q: "acme" });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toContain("Acme");
  });

  it("filters by stage", () => {
    const result = filterAndSortItems(items, {
      sort: "updated",
      stageId: interview.id,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.currentStageId).toBe(interview.id);
  });

  it("sorts by title", () => {
    const result = filterAndSortItems(items, { sort: "title" });
    expect(result[0]?.title).toContain("Designer");
  });
});
