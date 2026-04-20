import { NextResponse } from "next/server";

import { getImageContentType, readUploadedFile } from "@/lib/upload-storage";

type Params = { params: Promise<{ fileName: string }> };

export async function GET(_: Request, { params }: Params) {
  const { fileName } = await params;

  try {
    const fileBuffer = await readUploadedFile(fileName);
    const contentType = getImageContentType(fileName);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
