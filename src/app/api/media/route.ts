import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { imageSize } from "image-size";
import { NextResponse } from "next/server";

import { ensureDefaultUser } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const media = await prisma.mediaAsset.findMany({
      where: { deletedAt: null },
      include: {
        postMedia: {
          include: {
            post: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("GET /api/media failed", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const owner = await ensureDefaultUser();
  const formData = await req.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const createdMedia = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dimensions = imageSize(buffer);

      if (!dimensions.width || !dimensions.height) {
        throw new Error("Failed to detect image size");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
      const storagePath = path.join("uploads", fileName);
      const absolutePath = path.join(uploadDir, fileName);

      await writeFile(absolutePath, buffer);

      return prisma.mediaAsset.create({
        data: {
          url: `/api/${storagePath}`,
          storagePath,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.width / dimensions.height,
          format: file.type || extension,
          sizeBytes: file.size,
          ownerId: owner.id,
        },
      });
    }),
  );

  return NextResponse.json(createdMedia, { status: 201 });
}
