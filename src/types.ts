import type { CalendarEntry, MediaAsset, Post, PostMedia, PostStatus } from "@prisma/client";

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
