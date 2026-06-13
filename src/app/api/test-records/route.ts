import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { testRecordInputSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    const records = await prisma.testRecord.findMany({
      where: query
        ? {
            text: {
              contains: query,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/test-records failed", error);
    return NextResponse.json({ error: "Failed to fetch test records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = testRecordInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const record = await prisma.testRecord.create({
      data: { text: parsed.data.text },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-records failed", error);
    return NextResponse.json({ error: "Failed to create test record" }, { status: 500 });
  }
}
