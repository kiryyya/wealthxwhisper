import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { mediaUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const media = await prisma.mediaAsset.findFirst({
    where: { id, deletedAt: null },
    include: {
      postMedia: {
        include: {
          post: true,
        },
      },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  return NextResponse.json(media);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = mediaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const media = await prisma.mediaAsset.update({
    where: { id },
    data: {
      title: parsed.data.title ?? null,
      altText: parsed.data.altText ?? null,
      tags: parsed.data.tags ?? [],
    },
    include: {
      postMedia: {
        include: {
          post: true,
        },
      },
    },
  });

  return NextResponse.json(media);
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await prisma.mediaAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
