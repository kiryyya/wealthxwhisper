import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategorySectionTodoInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string; sectionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id, sectionId } = await params;
  const body = await req.json();
  const parsed = eventCategorySectionTodoInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const section = await prisma.eventCategorySection.findFirst({
      where: { id: sectionId, categoryId: id },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const lastTodo = await prisma.eventCategorySectionTodo.findFirst({
      where: { sectionId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const todo = await prisma.eventCategorySectionTodo.create({
      data: {
        sectionId,
        text: parsed.data.text,
        sortOrder: (lastTodo?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("POST /api/event-categories/[id]/sections/[sectionId]/todos failed", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
