import { describe, expect, it } from "vitest";
import { resolveTargetSlug } from "@/lib/templates/resolveTargetSlug";

describe("resolveTargetSlug", () => {
  const sourceSlugs = new Set(["inquiry", "delivered", "paid"]);

  it("uses explicit mapping when valid", () => {
    expect(
      resolveTargetSlug("in-progress", { "in-progress": "delivered" }, sourceSlugs, "inquiry"),
    ).toBe("delivered");
  });

  it("falls back when mapping is invalid", () => {
    expect(
      resolveTargetSlug("in-progress", { "in-progress": "missing" }, sourceSlugs, "inquiry"),
    ).toBe("inquiry");
  });

  it("falls back when mapping is missing", () => {
    expect(resolveTargetSlug("in-progress", {}, sourceSlugs, "paid")).toBe("paid");
  });
});
