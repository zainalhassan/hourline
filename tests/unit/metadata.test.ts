import { describe, expect, it } from "vitest";
import {
  getDeadlineDisplay,
  getDealValueDisplay,
  getMetadataDisplayRows,
  getInvestmentDisplay,
  getSalaryDisplay,
} from "@/lib/items/formatMetadata";
import { getMetadataSchema } from "@/lib/items/metadataSchemas";

describe("metadata schemas and display", () => {
  it("parses job search salary metadata", () => {
    const schema = getMetadataSchema("JOB_SEARCH");
    const parsed = schema.safeParse({
      company: "Acme",
      salaryMin: "120000",
      salaryMax: "150000",
      salaryCurrency: "USD",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.salaryMin).toBe(120000);
    }
  });

  it("parses investment metadata", () => {
    const schema = getMetadataSchema("INVESTMENTS");
    const parsed = schema.safeParse({
      assetType: "stock",
      ticker: "AAPL",
      amountInvested: "10000",
      currentValue: "12000",
      currency: "USD",
    });
    expect(parsed.success).toBe(true);
  });

  it("displays job salary rows", () => {
    const rows = getMetadataDisplayRows("JOB_SEARCH", {
      company: "Acme",
      salaryMin: 120000,
      salaryMax: 150000,
      salaryCurrency: "USD",
    });
    expect(rows.some((r) => r.label === "Company")).toBe(true);
    expect(rows.some((r) => r.label === "Salary")).toBe(true);
  });

  it("displays investment value", () => {
    expect(
      getInvestmentDisplay({ currentValue: 5000, currency: "USD" }),
    ).toMatch(/5/);
  });

  it("displays salary from metadata", () => {
    expect(
      getSalaryDisplay({ salaryMin: 90000, salaryMax: 110000, salaryCurrency: "USD" }),
    ).toContain("–");
  });

  it("displays deal value for sales", () => {
    expect(getDealValueDisplay({ dealValue: 50000, dealCurrency: "USD" })).toMatch(
      /50/,
    );
  });

  it("displays grad school deadline", () => {
    expect(getDeadlineDisplay({ deadline: "Jan 15, 2027" })).toBe("Jan 15, 2027");
  });
});
