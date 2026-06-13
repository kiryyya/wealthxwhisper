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

export const testRecordInputSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});

export const roadmapCardSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  date: z.string().nullable().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  color: z.string().min(1),
});

export const roadmapEdgeSchema = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
});

export const roadmapSaveSchema = z.object({
  cards: z.array(roadmapCardSchema),
  edges: z.array(roadmapEdgeSchema),
});
