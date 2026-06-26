import { describe, expect, it } from "vitest";
import { computeAverageRating, toTemplateMetrics } from "@/lib/marketplace/metrics";
import { parseMarketplaceSort } from "@/lib/marketplace/queries";

describe("marketplace utilities", () => {
  it("computes average rating rounded to one decimal", () => {
    expect(computeAverageRating(44, 10)).toBe(4.4);
    expect(computeAverageRating(0, 0)).toBeNull();
  });

  it("maps template metrics", () => {
    const metrics = toTemplateMetrics({
      likeCount: 5,
      copyCount: 10,
      commentCount: 2,
      ratingSum: 13,
      ratingCount: 3,
    });
    expect(metrics.averageRating).toBeCloseTo(4.3, 1);
    expect(metrics.likeCount).toBe(5);
    expect(metrics.pipelineCount).toBe(0);
  });

  it("parses marketplace sort params", () => {
    expect(parseMarketplaceSort("rated")).toBe("rated");
    expect(parseMarketplaceSort("invalid")).toBe("popular");
    expect(parseMarketplaceSort(undefined)).toBe("popular");
  });
});
