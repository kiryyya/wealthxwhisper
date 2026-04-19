import { NextResponse } from "next/server";

import { ensureDefaultUser } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { postInputSchema } from "@/lib/validators";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      include: {
        media: {
          orderBy: { order: "asc" },
          include: { mediaAsset: true },
        },
      },
      orderBy: [{ positionIndex: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/posts failed", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = postInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const owner = await ensureDefaultUser();
  const data = parsed.data;

  const post = await prisma.post.create({
    data: {
      title: data.title,
      caption: data.caption ?? null,
      status: data.status,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      positionIndex: data.positionIndex,
      ownerId: owner.id,
      media: {
        create: data.mediaAssetIds.map((mediaAssetId, index) => ({
          mediaAssetId,
          order: index,
        })),
      },
      calendarEntry: data.scheduledAt
        ? {
            create: {
              date: new Date(data.scheduledAt),
            },
          }
        : undefined,
    },
    include: {
      media: {
        orderBy: { order: "asc" },
        include: { mediaAsset: true },
      },
      calendarEntry: true,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
