import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { testRecordInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const record = await prisma.testRecord.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ error: "Test record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/test-records/[id] failed", error);
    return NextResponse.json({ error: "Failed to fetch test record" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = testRecordInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const record = await prisma.testRecord.update({
      where: { id },
      data: { text: parsed.data.text },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("PATCH /api/test-records/[id] failed", error);
    return NextResponse.json({ error: "Failed to update test record" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.testRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/test-records/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete test record" }, { status: 404 });
  }
}
