import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildStagesFromInput } from "@/lib/pipelines/stageColors";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function createTestUser(label: string) {
  const email = `test-${label}-${Date.now()}@waypoint.test`;
  return prisma.user.create({
    data: {
      name: `Test ${label}`,
      email,
      passwordHash: await bcrypt.hash("testpass12345", 12),
    },
  });
}

export async function deleteTestUser(userId: string) {
  await prisma.pipeline.deleteMany({ where: { userId } });
  await prisma.userTemplate.deleteMany({ where: { userId } });
  await prisma.templateLike.deleteMany({ where: { userId } });
  await prisma.templateRating.deleteMany({ where: { userId } });
  await prisma.templateComment.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

export function freelanceStagesOld() {
  return buildStagesFromInput([
    { name: "Inquiry", isEntry: true },
    { name: "Proposal sent" },
    { name: "In progress" },
    { name: "Delivered" },
    { name: "Paid", isTerminal: true },
  ]);
}

export function freelanceStagesNew() {
  return buildStagesFromInput([
    { name: "Inquiry", isEntry: true },
    { name: "Proposal sent" },
    { name: "Delivered" },
    { name: "Paid", isTerminal: true },
  ]);
}

export function stageRows(stages: ReturnType<typeof buildStagesFromInput>) {
  return stages.map((s) => ({
    name: s.name,
    slug: s.slug,
    sortOrder: s.sortOrder,
    isEntry: s.isEntry ?? false,
    isTerminal: s.isTerminal ?? false,
    color: s.color,
  }));
}
