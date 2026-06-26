import { describe, expect, it } from "vitest";
import { PIPELINE_TEMPLATES, TEMPLATE_LIST } from "@/lib/pipelines/templates";

describe("pipeline templates", () => {
  it("includes all user-facing built-in templates", () => {
    const names = TEMPLATE_LIST.map((t) => t.template);
    expect(names).toContain("JOB_SEARCH");
    expect(names).toContain("INVESTMENTS");
    expect(names).not.toContain("CUSTOM");
  });

  it("defines entry and terminal stages for job search", () => {
    const stages = PIPELINE_TEMPLATES.JOB_SEARCH.stages;
    expect(stages.some((s) => s.isEntry)).toBe(true);
    expect(stages.some((s) => s.isTerminal)).toBe(true);
  });

  it("defines investment stages for portfolio tracking", () => {
    const slugs = PIPELINE_TEMPLATES.INVESTMENTS.stages.map((s) => s.slug);
    expect(slugs).toContain("holding");
    expect(slugs).toContain("sold");
  });
});
