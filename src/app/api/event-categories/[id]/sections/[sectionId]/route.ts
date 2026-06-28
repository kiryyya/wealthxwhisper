import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategorySectionUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string; sectionId: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id, sectionId } = await params;

  try {
    const section = await prisma.eventCategorySection.findFirst({
      where: { id: sectionId, categoryId: id },
      include: {
        todos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("GET /api/event-categories/[id]/sections/[sectionId] failed", error);
    return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id, sectionId } = await params;
  const body = await req.json();
  const parsed = eventCategorySectionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await prisma.eventCategorySection.findFirst({
      where: { id: sectionId, categoryId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const section = await prisma.eventCategorySection.update({
      where: { id: sectionId },
      data: parsed.data,
      include: {
        todos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("PATCH /api/event-categories/[id]/sections/[sectionId] failed", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id, sectionId } = await params;

  try {
    const existing = await prisma.eventCategorySection.findFirst({
      where: { id: sectionId, categoryId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.eventCategorySection.delete({ where: { id: sectionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/event-categories/[id]/sections/[sectionId] failed", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
