import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/pipelines/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates text", () => {
    expect(slugify("In Progress")).toBe("in-progress");
  });

  it("trims whitespace", () => {
    expect(slugify("  Applied  ")).toBe("applied");
  });

  it("returns stage for empty input", () => {
    expect(slugify("")).toBe("stage");
    expect(slugify("---")).toBe("stage");
  });

  it("handles special characters", () => {
    expect(slugify("Q&A / Review")).toBe("q-a-review");
  });
});
