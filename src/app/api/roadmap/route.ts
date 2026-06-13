import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { roadmapSaveSchema } from "@/lib/validators";
import type { RoadmapCard } from "@/types";

const DEFAULT_CANVAS_ID = "main";

function parseItems(value: Prisma.JsonValue): RoadmapCard[] {
  if (!Array.isArray(value)) return [];
  return value as RoadmapCard[];
}

export async function GET() {
  try {
    const canvas = await prisma.roadmapCanvas.upsert({
      where: { id: DEFAULT_CANVAS_ID },
      update: {},
      create: { id: DEFAULT_CANVAS_ID, items: [] },
    });

    return NextResponse.json({
      id: canvas.id,
      items: parseItems(canvas.items),
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/roadmap failed", error);
    return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = roadmapSaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const canvas = await prisma.roadmapCanvas.upsert({
      where: { id: DEFAULT_CANVAS_ID },
      update: { items: parsed.data.items },
      create: { id: DEFAULT_CANVAS_ID, items: parsed.data.items },
    });

    return NextResponse.json({
      id: canvas.id,
      items: parseItems(canvas.items),
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
    });
  } catch (error) {
    console.error("PUT /api/roadmap failed", error);
    return NextResponse.json({ error: "Failed to save roadmap" }, { status: 500 });
  }
}
