import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { roadmapSaveSchema } from "@/lib/validators";
import type { RoadmapCard, RoadmapEdge } from "@/types";

const DEFAULT_CANVAS_ID = "main";

type CanvasPayload = {
  cards: RoadmapCard[];
  edges: RoadmapEdge[];
};

function parseCanvasData(value: Prisma.JsonValue): CanvasPayload {
  if (Array.isArray(value)) {
    return { cards: value as RoadmapCard[], edges: [] };
  }

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    return {
      cards: Array.isArray(data.cards) ? (data.cards as RoadmapCard[]) : [],
      edges: Array.isArray(data.edges) ? (data.edges as RoadmapEdge[]) : [],
    };
  }

  return { cards: [], edges: [] };
}

export async function GET() {
  try {
    const canvas = await prisma.roadmapCanvas.upsert({
      where: { id: DEFAULT_CANVAS_ID },
      update: {},
      create: { id: DEFAULT_CANVAS_ID, items: { cards: [], edges: [] } },
    });

    const { cards, edges } = parseCanvasData(canvas.items);

    return NextResponse.json({
      id: canvas.id,
      cards,
      edges,
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
    const payload = {
      cards: parsed.data.cards,
      edges: parsed.data.edges,
    };

    const canvas = await prisma.roadmapCanvas.upsert({
      where: { id: DEFAULT_CANVAS_ID },
      update: { items: payload },
      create: { id: DEFAULT_CANVAS_ID, items: payload },
    });

    const { cards, edges } = parseCanvasData(canvas.items);

    return NextResponse.json({
      id: canvas.id,
      cards,
      edges,
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
    });
  } catch (error) {
    console.error("PUT /api/roadmap failed", error);
    return NextResponse.json({ error: "Failed to save roadmap" }, { status: 500 });
  }
}
