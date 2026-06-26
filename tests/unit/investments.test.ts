import { describe, expect, it } from "vitest";
import { computeInvestmentBreakdown } from "@/lib/investments/breakdown";
import { item, stage } from "../helpers/factories";

describe("computeInvestmentBreakdown", () => {
  const holding = stage({ slug: "holding", name: "Holding" });
  const researching = stage({ slug: "researching", name: "Researching" });

  it("only counts bought, holding, and sold stages", () => {
    const breakdown = computeInvestmentBreakdown([
      item({
        currentStage: researching,
        metadata: { amountInvested: 1000, currentValue: 1000, assetType: "stock" },
      }),
      item({
        currentStage: holding,
        metadata: { amountInvested: 5000, currentValue: 6000, assetType: "etf" },
      }),
    ]);

    expect(breakdown.totals.count).toBe(1);
    expect(breakdown.totals.invested).toBe(5000);
    expect(breakdown.totals.current).toBe(6000);
    expect(breakdown.totals.gainLoss).toBe(1000);
  });

  it("groups by asset type with allocation percentages", () => {
    const breakdown = computeInvestmentBreakdown([
      item({
        currentStage: holding,
        metadata: { amountInvested: 3000, currentValue: 3000, assetType: "stock" },
      }),
      item({
        currentStage: holding,
        metadata: { amountInvested: 7000, currentValue: 7000, assetType: "crypto" },
      }),
    ]);

    expect(breakdown.rows).toHaveLength(2);
    expect(breakdown.rows[0].allocationPct + breakdown.rows[1].allocationPct).toBe(100);
  });

  it("uses currentValue fallback to invested amount", () => {
    const breakdown = computeInvestmentBreakdown([
      item({
        currentStage: holding,
        metadata: { amountInvested: 2000, assetType: "stock" },
      }),
    ]);
    expect(breakdown.totals.current).toBe(2000);
  });
});
