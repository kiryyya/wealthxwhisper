import { NextResponse } from "next/server";

import { filterKnowledgePages } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";
import { knowledgeBasePageInputSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  try {
    const pages = await prisma.knowledgeBasePage.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });

    const { pages: filteredPages, matchIds } = filterKnowledgePages(pages, query);

    return NextResponse.json({
      pages: query.trim() ? filteredPages : pages,
      matchIds: Array.from(matchIds),
    });
  } catch (error) {
    console.error("GET /api/knowledge-base failed", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base pages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = knowledgeBasePageInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.parentId) {
      const parent = await prisma.knowledgeBasePage.findUnique({
        where: { id: parsed.data.parentId },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ error: "Parent page not found" }, { status: 404 });
      }
    }

    const lastSibling = await prisma.knowledgeBasePage.findFirst({
      where: { parentId: parsed.data.parentId ?? null },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const page = await prisma.knowledgeBasePage.create({
      data: {
        title: parsed.data.title,
        parentId: parsed.data.parentId ?? null,
        sortOrder: (lastSibling?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("POST /api/knowledge-base failed", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
