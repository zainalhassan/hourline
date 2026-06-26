import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function createTestUser(label: string) {
  const email = `test-${label}-${Date.now()}@hourline.test`;
  const passwordHash = await bcrypt.hash("password123", 12);

  return prisma.user.create({
    data: {
      name: `Test ${label}`,
      email,
      passwordHash,
    },
  });
}

export async function deleteTestUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
