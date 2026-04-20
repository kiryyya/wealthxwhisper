import path from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const RAILWAY_VOLUME_UPLOAD_DIR = "/data/uploads";

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export function getUploadDir() {
  // Prefer mounted Railway volume when available.
  if (existsSync("/data")) {
    return RAILWAY_VOLUME_UPLOAD_DIR;
  }

  return process.env.UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_DIR;
}

export function getUploadFilePath(fileName: string) {
  return path.join(getUploadDir(), path.basename(fileName));
}

export function getImageContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

export async function readUploadedFile(fileName: string) {
  const safeName = path.basename(fileName);
  const primaryPath = getUploadFilePath(safeName);

  try {
    return await readFile(primaryPath);
  } catch {
    // Backward compatibility for files uploaded before volume storage rollout.
    const legacyPath = path.join(DEFAULT_UPLOAD_DIR, safeName);
    return readFile(legacyPath);
  }
}
