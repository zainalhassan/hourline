import { describe, expect, it } from "vitest";
import { buildSankeyData, sanitizeSankeyForECharts } from "@/lib/sankey/buildSankeyData";
import { stage } from "../helpers/factories";

describe("buildSankeyData", () => {
  const applied = stage({ id: "s1", name: "Applied", slug: "applied", sortOrder: 0, isEntry: true });
  const interview = stage({ id: "s2", name: "Interview", slug: "interview", sortOrder: 2 });

  it("builds nodes and links from stage events", () => {
    const data = buildSankeyData([applied, interview], [
      {
        id: "e1",
        itemId: "i1",
        fromStageId: null,
        toStageId: applied.id,
        occurredAt: new Date(),
        toStage: applied,
        fromStage: null,
      },
      {
        id: "e2",
        itemId: "i1",
        fromStageId: applied.id,
        toStageId: interview.id,
        occurredAt: new Date(),
        fromStage: applied,
        toStage: interview,
      },
    ]);

    expect(data.nodes.some((n) => n.name === "Started")).toBe(true);
    expect(data.nodes.some((n) => n.name === "Applied")).toBe(true);
    expect(data.links).toContainEqual({ source: "Started", target: "Applied", value: 1 });
    expect(data.links).toContainEqual({ source: "Applied", target: "Interview", value: 1 });
  });

  it("ignores backward transitions that would create cycles", () => {
    const data = buildSankeyData([applied, interview], [
      {
        id: "e1",
        itemId: "i1",
        fromStageId: null,
        toStageId: applied.id,
        occurredAt: new Date(),
        toStage: applied,
        fromStage: null,
      },
      {
        id: "e2",
        itemId: "i1",
        fromStageId: applied.id,
        toStageId: interview.id,
        occurredAt: new Date(),
        fromStage: applied,
        toStage: interview,
      },
      {
        id: "e3",
        itemId: "i1",
        fromStageId: interview.id,
        toStageId: applied.id,
        occurredAt: new Date(),
        fromStage: interview,
        toStage: applied,
      },
    ]);

    expect(data.links).toContainEqual({ source: "Applied", target: "Interview", value: 1 });
    expect(data.links.some((l) => l.source === "Interview" && l.target === "Applied")).toBe(
      false,
    );
  });

  it("handles stage names containing arrow-like characters", () => {
    const weird = stage({ id: "s3", name: "Go → Live", slug: "go-live", sortOrder: 3 });
    const data = buildSankeyData([applied, weird], [
      {
        id: "e3",
        itemId: "i2",
        fromStageId: applied.id,
        toStageId: weird.id,
        occurredAt: new Date(),
        fromStage: applied,
        toStage: weird,
      },
    ]);

    expect(data.links).toContainEqual({ source: "Applied", target: "Go → Live", value: 1 });
  });

  it("sanitizeSankeyForECharts returns an acyclic graph", () => {
    const cyclic = sanitizeSankeyForECharts({
      nodes: [{ name: "A" }, { name: "B" }, { name: "C" }],
      links: [
        { source: "A", target: "B", value: 1 },
        { source: "B", target: "C", value: 1 },
        { source: "C", target: "A", value: 1 },
      ],
    });
    expect(cyclic.links.length).toBeGreaterThan(0);
    expect(cyclic.links.length).toBeLessThan(3);
  });
});
