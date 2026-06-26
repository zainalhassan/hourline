import { describe, expect, it } from "vitest";
import { PipelineTemplate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPipelineFromTemplate } from "@/lib/pipelines/createPipelineFromTemplate";
import { createPipelineFromUserTemplate } from "@/lib/pipelines/createPipelineFromUserTemplate";
import { PIPELINE_TEMPLATES } from "@/lib/pipelines/templates";
import { createTestUser, deleteTestUser, hasDatabase, stageRows } from "../helpers/testDb";
import { buildStagesFromInput } from "@/lib/pipelines/stageColors";

describe.skipIf(!hasDatabase())("pipeline integration", () => {
  it("creates pipeline from built-in template with entry stage", async () => {
    const user = await createTestUser("pipeline-builtin");

    const pipeline = await createPipelineFromTemplate(
      user.id,
      "Test Job Hunt",
      PipelineTemplate.JOB_SEARCH,
    );

    expect(pipeline.stages.length).toBe(
      PIPELINE_TEMPLATES[PipelineTemplate.JOB_SEARCH].stages.length,
    );
    expect(pipeline.stages.some((s) => s.isEntry)).toBe(true);

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await deleteTestUser(user.id);
  });

  it("creates pipeline from user template and links userTemplateId", async () => {
    const user = await createTestUser("pipeline-custom");

    const template = await prisma.userTemplate.create({
      data: {
        userId: user.id,
        name: "Custom flow",
        stages: {
          create: stageRows(
            buildStagesFromInput([
              { name: "Backlog", isEntry: true },
              { name: "Shipped", isTerminal: true },
            ]),
          ),
        },
      },
    });

    const pipeline = await createPipelineFromUserTemplate(user.id, "Sprint board", template.id);

    expect(pipeline.userTemplateId).toBe(template.id);
    expect(pipeline.stages.map((s) => s.slug)).toEqual(["backlog", "shipped"]);

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await deleteTestUser(user.id);
  });

  it("creates investments pipeline with expected stages", async () => {
    const user = await createTestUser("pipeline-invest");

    const pipeline = await createPipelineFromTemplate(
      user.id,
      "Portfolio",
      PipelineTemplate.INVESTMENTS,
    );

    expect(pipeline.stages.some((s) => s.slug === "holding")).toBe(true);
    expect(pipeline.stages.some((s) => s.slug === "researching")).toBe(true);

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await deleteTestUser(user.id);
  });
});
