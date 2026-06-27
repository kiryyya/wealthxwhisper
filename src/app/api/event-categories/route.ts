import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventCategoryInputSchema } from "@/lib/validators";

export async function GET() {
  try {
    const categories = await prisma.eventCategory.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/event-categories failed", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = eventCategoryInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await prisma.eventCategory.create({
      data: { name: parsed.data.name },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/event-categories failed", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
