import { NextResponse } from "next/server";

import { collectDescendantIds } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";
import { knowledgeBasePageUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const page = await prisma.knowledgeBasePage.findUnique({ where: { id } });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("GET /api/knowledge-base/[id] failed", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = knowledgeBasePageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await prisma.knowledgeBasePage.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      if (parsed.data.parentId === id) {
        return NextResponse.json({ error: "Page cannot be its own parent" }, { status: 400 });
      }

      const parent = await prisma.knowledgeBasePage.findUnique({
        where: { id: parsed.data.parentId },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ error: "Parent page not found" }, { status: 404 });
      }

      const allPages = await prisma.knowledgeBasePage.findMany({
        select: { id: true, parentId: true },
      });

      const descendants = collectDescendantIds(allPages, id);
      if (descendants.has(parsed.data.parentId)) {
        return NextResponse.json(
          { error: "Cannot move page into its own descendant" },
          { status: 400 },
        );
      }
    }

    const page = await prisma.knowledgeBasePage.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("PATCH /api/knowledge-base/[id] failed", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const existing = await prisma.knowledgeBasePage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await prisma.knowledgeBasePage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/knowledge-base/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
