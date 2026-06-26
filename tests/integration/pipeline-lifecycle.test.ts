import { describe, expect, it, vi } from "vitest";
import { updatePipeline } from "@/actions/pipelines";
import { auth } from "@/lib/auth";
import {
  createPipelineFromTemplate,
  getUserPipelines,
} from "@/lib/pipelines/createPipelineFromTemplate";
import { prisma } from "@/lib/prisma";
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

describe.skipIf(!hasDatabase())("pipeline lifecycle actions", () => {
  it("renames a pipeline and hides archived pipelines from home", async () => {
    const user = await createTestUser("pipeline-lifecycle");
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, name: user.name },
    } as Awaited<ReturnType<typeof auth>>);
    const pipeline = await createPipelineFromTemplate(
      user.id,
      "Old name",
      "SALES",
    );

    const formData = new FormData();
    formData.set("name", "New name");
    const updateResult = await updatePipeline(pipeline.id, {}, formData);
    expect(updateResult.success).toBe(true);

    const renamed = await prisma.pipeline.findUnique({
      where: { id: pipeline.id },
    });
    expect(renamed?.name).toBe("New name");

    await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { isArchived: true },
    });

    const visible = await getUserPipelines(user.id);
    expect(visible.some((p) => p.id === pipeline.id)).toBe(false);

    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await deleteTestUser(user.id);
  });
});
