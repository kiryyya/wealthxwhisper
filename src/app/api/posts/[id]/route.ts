import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { postInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      media: {
        orderBy: { order: "asc" },
        include: { mediaAsset: true },
      },
      calendarEntry: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = postInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({
      where: { id },
      data: {
        title: data.title,
        caption: data.caption ?? null,
        status: data.status,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        positionIndex: data.positionIndex,
        media: {
          deleteMany: {},
          create: data.mediaAssetIds.map((mediaAssetId, index) => ({
            mediaAssetId,
            order: index,
          })),
        },
      },
    });

    if (data.scheduledAt) {
      await tx.calendarEntry.upsert({
        where: { postId: id },
        create: { postId: id, date: new Date(data.scheduledAt) },
        update: { date: new Date(data.scheduledAt) },
      });
    } else {
      await tx.calendarEntry.deleteMany({ where: { postId: id } });
    }

    return tx.post.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        media: {
          orderBy: { order: "asc" },
          include: { mediaAsset: true },
        },
        calendarEntry: true,
      },
    });
  });

  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await prisma.$transaction([
    prisma.calendarEntry.deleteMany({ where: { postId: id } }),
    prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
