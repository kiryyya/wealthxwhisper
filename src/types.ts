import type { CalendarEntry, MediaAsset, Post, PostMedia, PostStatus, TestRecord } from "@prisma/client";

export type PostWithMedia = Post & {
  media: (PostMedia & {
    mediaAsset: MediaAsset;
  })[];
};

export type MediaAssetWithPosts = MediaAsset & {
  postMedia: (PostMedia & {
    post: Post;
  })[];
};

export type CalendarDayGroup = {
  date: string;
  count: number;
  posts: {
    id: string;
    title: string;
    status: PostStatus;
    scheduledAt: string | Date | null;
    positionIndex: number;
  }[];
};

export type UpsertPostPayload = {
  title: string;
  caption?: string | null;
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  positionIndex: number;
  mediaAssetIds: string[];
};

export type UpdateMediaPayload = {
  title?: string | null;
  altText?: string | null;
  tags?: string[];
};

export type CalendarEntryWithPost = CalendarEntry & {
  post: Post;
};

export type TestRecordPayload = {
  text: string;
};

export type RoadmapCard = {
  id: string;
  text: string;
  date: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type RoadmapEdge = {
  id: string;
  fromId: string;
  toId: string;
};

export type RoadmapCanvasData = {
  id: string;
  cards: RoadmapCard[];
  edges: RoadmapEdge[];
  createdAt: string;
  updatedAt: string;
};

export type GptMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type GptChatData = {
  id: string;
  prompt: string;
  messages: GptMessage[];
  createdAt: string;
  updatedAt: string;
};

export type { TestRecord };
