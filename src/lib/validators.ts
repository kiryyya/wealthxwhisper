import { PostStatus } from "@prisma/client";
import { z } from "zod";

import { MAX_POST_MEDIA } from "@/lib/constants";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  caption: z.string().trim().optional().nullable(),
  status: z.nativeEnum(PostStatus),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  positionIndex: z.number().int().nonnegative(),
  mediaAssetIds: z.array(z.string()).max(MAX_POST_MEDIA),
});

export const mediaUpdateSchema = z.object({
  title: z.string().trim().optional().nullable(),
  altText: z.string().trim().optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
});
