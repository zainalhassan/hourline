import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { copyPublicTemplate } from "@/lib/marketplace/copyTemplate";
import { createTestUser, deleteTestUser, hasDatabase, stageRows } from "../helpers/testDb";
import { buildStagesFromInput } from "@/lib/pipelines/stageColors";

describe.skipIf(!hasDatabase())("marketplace integration", () => {
  it("copies public template as linked or independent", async () => {
    const author = await createTestUser("mkt-author");
    const buyer = await createTestUser("mkt-buyer");

    const source = await prisma.userTemplate.create({
      data: {
        userId: author.id,
        name: "Public template",
        isPublic: true,
        publishedAt: new Date(),
        copyCount: 0,
        stages: {
          create: stageRows(
            buildStagesFromInput([
              { name: "Start", isEntry: true },
              { name: "Finish", isTerminal: true },
            ]),
          ),
        },
      },
    });

    const linked = await copyPublicTemplate(buyer.id, source.id, true);
    const independent = await copyPublicTemplate(buyer.id, source.id, false);

    expect(linked.isLinkedToSource).toBe(true);
    expect(linked.forkedFromId).toBe(source.id);
    expect(independent.isLinkedToSource).toBe(false);

    const updatedSource = await prisma.userTemplate.findUnique({ where: { id: source.id } });
    expect(updatedSource?.copyCount).toBe(2);

    await deleteTestUser(author.id);
    await deleteTestUser(buyer.id);
  });

  it("increments like count without duplicate constraint issues", async () => {
    const author = await createTestUser("mkt-like-author");
    const fan = await createTestUser("mkt-fan");

    const source = await prisma.userTemplate.create({
      data: {
        userId: author.id,
        name: "Liked template",
        isPublic: true,
        publishedAt: new Date(),
        likeCount: 0,
        stages: {
          create: stageRows(
            buildStagesFromInput([
              { name: "A", isEntry: true },
              { name: "B", isTerminal: true },
            ]),
          ),
        },
      },
    });

    await prisma.templateLike.create({
      data: { userId: fan.id, userTemplateId: source.id },
    });
    await prisma.userTemplate.update({
      where: { id: source.id },
      data: { likeCount: { increment: 1 } },
    });

    const liked = await prisma.userTemplate.findUnique({ where: { id: source.id } });
    expect(liked?.likeCount).toBe(1);

    await deleteTestUser(author.id);
    await deleteTestUser(fan.id);
  });
});
