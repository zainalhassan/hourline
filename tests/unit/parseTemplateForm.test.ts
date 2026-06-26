import { describe, expect, it } from "vitest";
import { parseTemplateFormData } from "@/lib/templates/parseTemplateForm";

describe("parseTemplateFormData", () => {
  it("parses template form stages and flags", () => {
    const form = new FormData();
    form.set("name", "Side projects");
    form.set("description", "My flow");
    form.append("stageName", "Start");
    form.append("stageEntry", "on");
    form.append("stageTerminal", "off");
    form.append("stageName", "Done");
    form.append("stageEntry", "off");
    form.append("stageTerminal", "on");

    const parsed = parseTemplateFormData(form);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Side projects");
      expect(parsed.data.stages).toHaveLength(2);
      expect(parsed.data.stages[0].isEntry).toBe(true);
      expect(parsed.data.stages[1].isTerminal).toBe(true);
    }
  });

  it("requires at least two stages", () => {
    const form = new FormData();
    form.set("name", "Too short");
    form.append("stageName", "Only one");
    form.append("stageEntry", "on");
    form.append("stageTerminal", "off");

    const parsed = parseTemplateFormData(form);
    expect(parsed.success).toBe(false);
  });
});
