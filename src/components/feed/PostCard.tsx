"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { CarouselIndicators } from "@/components/ui/CarouselIndicators";
import type { PostWithMedia } from "@/types";

type PostCardProps = {
  post: PostWithMedia;
  onOpen: (post: PostWithMedia) => void;
};

export function PostCard({ post, onOpen }: PostCardProps) {
  const assets = useMemo(() => post.media.map((item) => item.mediaAsset), [post.media]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMany = assets.length > 1;
  const current = assets[currentIndex];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % assets.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + assets.length) % assets.length);
  };

  return (
    <article
      className="group relative cursor-pointer overflow-hidden bg-zinc-900"
      onClick={() => onOpen(post)}
    >
      <div className="relative h-full w-full overflow-hidden">
        {current ? (
          <Image
            src={current.url}
            alt={current.altText || post.title}
            fill
            sizes="(max-width: 1024px) 33vw, 220px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 text-sm text-zinc-400">
            Нет изображения
          </div>
        )}

        {hasMany && <CarouselArrow direction="left" onClick={prev} />}
        {hasMany && <CarouselArrow direction="right" onClick={next} />}
        <CarouselIndicators total={assets.length} current={currentIndex} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}
