import type { PostWithMedia } from "@/types";

import { PostCard } from "./PostCard";

type Props = {
  posts: PostWithMedia[];
  onOpenPost: (post: PostWithMedia) => void;
  className?: string;
};

export function PostGrid({ posts, onOpenPost, className }: Props) {
  return (
    <div className={`grid grid-cols-3 gap-[2px] ${className ?? ""}`}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onOpen={onOpenPost} />
      ))}
    </div>
  );
}
