import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategoryUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const category = await prisma.eventCategory.findUnique({ where: { id } });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("GET /api/event-categories/[id] failed", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = eventCategoryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await prisma.eventCategory.update({
      where: { id },
      data: {
        name: parsed.data.name,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("PATCH /api/event-categories/[id] failed", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.eventCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/event-categories/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 404 });
  }
}
