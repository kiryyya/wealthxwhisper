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

export const gptPromptSchema = z.object({
  prompt: z.string(),
});

export const gptChatInputSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  prompt: z.string().optional(),
});

export const eventCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const eventCategoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  notes: z.string().optional(),
});

export const eventCategorySectionInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const eventCategorySectionUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export const eventCategorySectionTodoInputSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});

export const eventCategorySectionTodoUpdateSchema = z.object({
  text: z.string().trim().min(1, "Text is required").optional(),
  completed: z.boolean().optional(),
});
