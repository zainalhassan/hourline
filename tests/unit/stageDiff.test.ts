import { describe, expect, it } from "vitest";
import { computeStageDiff } from "@/lib/templates/stageDiff";
import { stageSnapshot } from "../helpers/factories";

describe("computeStageDiff", () => {
  const current = [
    stageSnapshot({ slug: "inquiry", name: "Inquiry", isEntry: true }),
    stageSnapshot({ slug: "proposal-sent", name: "Proposal sent" }),
    stageSnapshot({ slug: "in-progress", name: "In progress" }),
    stageSnapshot({ slug: "paid", name: "Paid", isTerminal: true }),
  ];

  const source = [
    stageSnapshot({ slug: "inquiry", name: "Inquiry", isEntry: true }),
    stageSnapshot({ slug: "proposal-sent", name: "Proposal sent" }),
    stageSnapshot({ slug: "delivered", name: "Delivered" }),
    stageSnapshot({ slug: "paid", name: "Paid", isTerminal: true }),
  ];

  it("detects added and removed stages", () => {
    const diff = computeStageDiff(current, source);
    expect(diff.removed.map((s) => s.slug)).toEqual(["in-progress"]);
    expect(diff.added.map((s) => s.slug)).toEqual(["delivered"]);
  });

  it("lists unchanged stages", () => {
    const diff = computeStageDiff(current, source);
    expect(diff.unchanged.map((s) => s.slug)).toContain("inquiry");
    expect(diff.unchanged.map((s) => s.slug)).toContain("proposal-sent");
  });

  it("detects renamed stages as updated", () => {
    const diff = computeStageDiff(
      [stageSnapshot({ slug: "idea", name: "Idea" })],
      [stageSnapshot({ slug: "idea", name: "Brainstorm" })],
    );
    expect(diff.updated).toHaveLength(1);
    expect(diff.updated[0].before.name).toBe("Idea");
    expect(diff.updated[0].after.name).toBe("Brainstorm");
  });
});
