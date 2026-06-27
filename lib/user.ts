import { prisma } from "@/lib/prisma";

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      employerName: true,
      employerEmail: true,
      ccSelfOnSubmit: true,
      submitMessage: true,
      activePreset: true,
      activeUserTemplateId: true,
      durationPresets: true,
      payPeriodType: true,
      paydayMode: true,
      paydayOfWeek: true,
      paydayOfMonth: true,
      payPeriodAnchor: true,
    },
  });
}
