import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createPipelineFromTemplate } from "@/lib/pipelines/createPipelineFromTemplate";
import { deleteItem, updateItem } from "@/actions/items";
import {
  createTestUser,
  deleteTestUser,
  hasDatabase,
} from "../helpers/testDb";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe.skipIf(!hasDatabase())("item lifecycle actions", () => {
  it("updates and deletes an item", async () => {
    const user = await createTestUser("items-lifecycle");
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, name: user.name },
    } as Awaited<ReturnType<typeof auth>>);
    const pipeline = await createPipelineFromTemplate(
      user.id,
      "Lifecycle test",
      "JOB_SEARCH",
    );

    const entryStage = pipeline.stages.find((s) => s.isEntry)!;
    const created = await prisma.item.create({
      data: {
        pipelineId: pipeline.id,
        title: "Original title",
        currentStageId: entryStage.id,
        metadata: { company: "Acme" },
      },
    });

    const formData = new FormData();
    formData.set("title", "Updated title");
    formData.set("subtitle", "New subtitle");
    formData.set("metadata.company", "Acme Corp");
    formData.set("metadata.salaryMin", "100000");

    const updateResult = await updateItem(
      pipeline.id,
      created.id,
      {},
      formData,
    );
    expect(updateResult.success).toBe(true);

    const updated = await prisma.item.findUnique({ where: { id: created.id } });
    expect(updated?.title).toBe("Updated title");
    expect(updated?.subtitle).toBe("New subtitle");

    try {
      await deleteItem(pipeline.id, created.id);
    } catch {
      // redirect after delete
    }

    const gone = await prisma.item.findUnique({ where: { id: created.id } });
    expect(gone).toBeNull();

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await deleteTestUser(user.id);
  });
});
