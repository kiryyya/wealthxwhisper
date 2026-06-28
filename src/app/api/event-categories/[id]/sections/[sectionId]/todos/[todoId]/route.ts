import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategorySectionTodoUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string; sectionId: string; todoId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, sectionId, todoId } = await params;
  const body = await req.json();
  const parsed = eventCategorySectionTodoUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const todo = await prisma.eventCategorySectionTodo.findFirst({
      where: {
        id: todoId,
        sectionId,
        section: { categoryId: id },
      },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const updated = await prisma.eventCategorySectionTodo.update({
      where: { id: todoId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "PATCH /api/event-categories/[id]/sections/[sectionId]/todos/[todoId] failed",
      error,
    );
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id, sectionId, todoId } = await params;

  try {
    const todo = await prisma.eventCategorySectionTodo.findFirst({
      where: {
        id: todoId,
        sectionId,
        section: { categoryId: id },
      },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    await prisma.eventCategorySectionTodo.delete({ where: { id: todoId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "DELETE /api/event-categories/[id]/sections/[sectionId]/todos/[todoId] failed",
      error,
    );
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
