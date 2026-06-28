import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategorySectionInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const sections = await prisma.eventCategorySection.findMany({
      where: { categoryId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { todos: true } },
        todos: { where: { completed: false }, select: { id: true } },
      },
    });

    return NextResponse.json(
      sections.map(({ _count, todos, ...section }) => ({
        ...section,
        todosCount: _count.todos,
        openTodosCount: todos.length,
      })),
    );
  } catch (error) {
    console.error("GET /api/event-categories/[id]/sections failed", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = eventCategorySectionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lastSection = await prisma.eventCategorySection.findFirst({
      where: { categoryId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const section = await prisma.eventCategorySection.create({
      data: {
        categoryId: id,
        name: parsed.data.name,
        sortOrder: (lastSection?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("POST /api/event-categories/[id]/sections failed", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
