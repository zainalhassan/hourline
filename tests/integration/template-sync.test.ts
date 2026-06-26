import { describe, expect, it } from "vitest";
import { PipelineTemplate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { copyPublicTemplate } from "@/lib/marketplace/copyTemplate";
import { applyTemplateSync, tryAutoSyncLinkedFork } from "@/lib/templates/applyTemplateSync";
import { buildSyncPreview } from "@/lib/templates/syncPreview";
import {
  createTestUser,
  deleteTestUser,
  freelanceStagesNew,
  freelanceStagesOld,
  hasDatabase,
  stageRows,
} from "../helpers/testDb";

describe.skipIf(!hasDatabase())("template sync integration", () => {
  it("flags pending sync when removed stages have items", async () => {
    const author = await createTestUser("author");
    const copier = await createTestUser("copier");

    const source = await prisma.userTemplate.create({
      data: {
        userId: author.id,
        name: "Freelance Projects",
        isPublic: true,
        publishedAt: new Date(),
        stages: { create: stageRows(freelanceStagesNew()) },
      },
      include: { stages: true },
    });

    const linkedCopy = await copyPublicTemplate(copier.id, source.id, true);

    await prisma.userTemplateStage.deleteMany({ where: { userTemplateId: linkedCopy.id } });
    await prisma.userTemplate.update({
      where: { id: linkedCopy.id },
      data: { stages: { create: stageRows(freelanceStagesOld()) } },
    });

    const pipeline = await prisma.pipeline.create({
      data: {
        userId: copier.id,
        userTemplateId: linkedCopy.id,
        name: "Client pipeline",
        template: PipelineTemplate.CUSTOM,
        stages: { create: stageRows(freelanceStagesOld()) },
      },
      include: { stages: true },
    });

    const inProgress = pipeline.stages.find((s) => s.slug === "in-progress")!;
    await prisma.item.create({
      data: {
        pipelineId: pipeline.id,
        title: "Active client",
        currentStageId: inProgress.id,
        stageEvents: {
          create: [{ fromStageId: null, toStageId: inProgress.id }],
        },
      },
    });

    const preview = await buildSyncPreview(linkedCopy.id, copier.id);
    expect(preview?.requiresWizard).toBe(true);
    expect(preview?.removedWithItems[0].itemCount).toBe(1);

    const auto = await tryAutoSyncLinkedFork(linkedCopy.id, copier.id);
    expect(auto.pending).toBe(true);
    expect(auto.applied).toBe(false);

    const pending = await prisma.userTemplate.findUnique({ where: { id: linkedCopy.id } });
    expect(pending?.pendingSourceSync).toBe(true);

    await applyTemplateSync(linkedCopy.id, copier.id, { "in-progress": "delivered" });

    const movedItem = await prisma.item.findFirst({ where: { pipelineId: pipeline.id } });
    const delivered = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id, slug: "delivered", isArchived: false },
    });
    expect(movedItem?.currentStageId).toBe(delivered?.id);

    const archived = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id, slug: "in-progress" },
    });
    expect(archived?.isArchived).toBe(true);

    await deleteTestUser(author.id);
    await deleteTestUser(copier.id);
  });

  it("auto-syncs when no items are in removed stages", async () => {
    const author = await createTestUser("author2");
    const copier = await createTestUser("copier2");

    const source = await prisma.userTemplate.create({
      data: {
        userId: author.id,
        name: "Simple flow",
        isPublic: true,
        publishedAt: new Date(),
        stages: { create: stageRows(freelanceStagesNew()) },
      },
    });

    const linkedCopy = await copyPublicTemplate(copier.id, source.id, true);

    await prisma.userTemplateStage.deleteMany({ where: { userTemplateId: linkedCopy.id } });
    await prisma.userTemplate.update({
      where: { id: linkedCopy.id },
      data: { stages: { create: stageRows(freelanceStagesOld()) } },
    });

    const auto = await tryAutoSyncLinkedFork(linkedCopy.id, copier.id);
    expect(auto.applied).toBe(true);

    const updated = await prisma.userTemplate.findUnique({
      where: { id: linkedCopy.id },
      include: { stages: true },
    });
    expect(updated?.stages.some((s) => s.slug === "in-progress")).toBe(false);
    expect(updated?.pendingSourceSync).toBe(false);

    await deleteTestUser(author.id);
    await deleteTestUser(copier.id);
  });
});
