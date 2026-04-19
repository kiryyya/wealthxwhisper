import { endOfMonth, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const monthDate = monthParam ? new Date(monthParam) : new Date();
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: { in: ["scheduled", "published"] },
      scheduledAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      scheduledAt: true,
      positionIndex: true,
    },
    orderBy: [{ scheduledAt: "asc" }, { positionIndex: "asc" }],
  });

  return NextResponse.json(posts);
}
