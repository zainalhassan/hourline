import { describe, expect, it } from "vitest";
import { pickEntryStage } from "@/lib/pipelines/pickEntryStage";
import { stage } from "../helpers/factories";

describe("pickEntryStage", () => {
  it("prefers the active entry stage", () => {
    const entry = stage({ slug: "inquiry", name: "Inquiry", isEntry: true });
    const other = stage({ slug: "done", name: "Done", sortOrder: 1 });
    expect(pickEntryStage([entry, other])).toBe(entry);
  });

  it("skips archived entry stages", () => {
    const archivedEntry = stage({
      slug: "old-entry",
      name: "Old entry",
      isEntry: true,
      isArchived: true,
    });
    const active = stage({
      slug: "proposal",
      name: "Proposal",
      sortOrder: 1,
      isEntry: false,
    });
    expect(pickEntryStage([archivedEntry, active])).toBe(active);
  });

  it("returns null when every stage is archived", () => {
    const archived = stage({
      slug: "removed",
      name: "Removed",
      isArchived: true,
    });
    expect(pickEntryStage([archived])).toBeNull();
  });
});
