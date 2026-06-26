import { describe, expect, it } from "vitest";
import { formatMoney, formatSalaryRange, getCurrency } from "@/lib/currencies";

describe("currencies", () => {
  it("formats money with currency code", () => {
    expect(formatMoney(120000, "USD")).toMatch(/\$|120/);
  });

  it("formats salary range", () => {
    const range = formatSalaryRange(100000, 150000, "USD");
    expect(range).toContain("–");
  });

  it("returns single value when min equals max", () => {
    const single = formatSalaryRange(100000, 100000, "USD");
    expect(single).not.toContain("–");
  });

  it("returns null for empty salary range", () => {
    expect(formatSalaryRange(null, null)).toBeNull();
  });

  it("falls back for unknown currency codes", () => {
    const currency = getCurrency("XXX");
    expect(currency.code).toBe("USD");
  });
});
