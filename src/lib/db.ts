import { DEFAULT_OWNER_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_OWNER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_OWNER_EMAIL,
      name: "Content Planner",
    },
  });
}
