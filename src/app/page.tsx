"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MediaAsset } from "@prisma/client";

import { PostGrid } from "@/components/feed/PostGrid";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PostForm } from "@/components/feed/PostForm";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { CarouselIndicators } from "@/components/ui/CarouselIndicators";
import type { PostWithMedia } from "@/types";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [mediaCatalog, setMediaCatalog] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<PostWithMedia | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState<PostWithMedia | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
      setLoadError(null);
    }

    try {
      const [postRes, mediaRes] = await Promise.all([fetch("/api/posts"), fetch("/api/media")]);
      const [postText, mediaText] = await Promise.all([postRes.text(), mediaRes.text()]);
      const postPayload = postText ? JSON.parse(postText) : [];
      const mediaPayload = mediaText ? JSON.parse(mediaText) : [];

      setPosts(Array.isArray(postPayload) ? postPayload : []);
      setMediaCatalog(Array.isArray(mediaPayload) ? mediaPayload : []);

      if (!postRes.ok || !mediaRes.ok) {
        setLoadError("Не удалось загрузить данные. Проверьте DATABASE_URL и prisma migrate.");
      }
    } catch {
      setPosts([]);
      setMediaCatalog([]);
      setLoadError("Ошибка чтения API-ответа. Проверьте, что база и миграции применены.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetch("/api/posts"), fetch("/api/media")])
      .then(async ([postRes, mediaRes]) => {
        const [postText, mediaText] = await Promise.all([postRes.text(), mediaRes.text()]);
        const postPayload = postText ? JSON.parse(postText) : [];
        const mediaPayload = mediaText ? JSON.parse(mediaText) : [];

        setPosts(Array.isArray(postPayload) ? postPayload : []);
        setMediaCatalog(Array.isArray(mediaPayload) ? mediaPayload : []);

        if (!postRes.ok || !mediaRes.ok) {
          setLoadError("Не удалось загрузить данные. Проверьте DATABASE_URL и prisma migrate.");
        }
      })
      .catch(() => {
        setPosts([]);
        setMediaCatalog([]);
        setLoadError("Ошибка чтения API-ответа. Проверьте, что база и миграции применены.");
      })
      .finally(() => setLoading(false));
  }, []);

  const detailAssets = useMemo(
    () => openDetail?.media.map((item) => item.mediaAsset) ?? [],
    [openDetail],
  );

  const deletePost = async (postId: string) => {
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setConfirmDelete(null);
    setOpenDetail(null);
    fetchData();
  };

  return (
    <section className="relative h-full overflow-hidden">
      {loading ? (
        <div className="rounded-xl border border-zinc-800 p-5 text-sm text-zinc-400">Загрузка...</div>
      ) : (
        <div className="feed-grid-shell h-full min-h-0 overflow-y-auto">
          {loadError && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-sm text-zinc-300">
              {loadError}
            </div>
          )}
          <PostGrid
            posts={posts}
            className="feed-grid"
            onOpenPost={(post) => {
              setDetailIndex(0);
              setOpenDetail(post);
            }}
          />
        </div>
      )}

      <button
        className="fixed bottom-6 right-6 rounded-full bg-zinc-700 p-4 text-zinc-100 shadow-2xl transition hover:bg-zinc-600"
        onClick={() => {
          setEditingPost(null);
          setOpenCreate(true);
        }}
      >
        <Plus />
      </button>

      <Modal
        open={openCreate}
        title={editingPost ? "Редактировать пост" : "Создать пост"}
        onClose={() => {
          setOpenCreate(false);
          setEditingPost(null);
        }}
      >
        <PostForm
          mediaCatalog={mediaCatalog}
          initialPost={editingPost}
          onCancel={() => {
            setOpenCreate(false);
            setEditingPost(null);
          }}
          onSaved={() => {
            setOpenCreate(false);
            setEditingPost(null);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        open={Boolean(openDetail)}
        title={openDetail?.title || "Детали поста"}
        onClose={() => setOpenDetail(null)}
      >
        {openDetail && (
          <div className="space-y-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-zinc-800">
              {detailAssets[detailIndex] ? (
                <Image
                  src={detailAssets[detailIndex].url}
                  alt={detailAssets[detailIndex].altText || openDetail.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Нет изображения
                </div>
              )}
              {detailAssets.length > 1 && (
                <>
                  <CarouselArrow
                    direction="left"
                    onClick={() =>
                      setDetailIndex((prev) => (prev - 1 + detailAssets.length) % detailAssets.length)
                    }
                  />
                  <CarouselArrow
                    direction="right"
                    onClick={() => setDetailIndex((prev) => (prev + 1) % detailAssets.length)}
                  />
                  <CarouselIndicators total={detailAssets.length} current={detailIndex} />
                </>
              )}
            </div>

            <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Caption:</span> {openDetail.caption || "—"}
              </p>
              <p>
                <span className="text-zinc-500">Status:</span> {openDetail.status}
              </p>
              <p>
                <span className="text-zinc-500">Scheduled:</span>{" "}
                {openDetail.scheduledAt ? new Date(openDetail.scheduledAt).toLocaleString() : "—"}
              </p>
              <p>
                <span className="text-zinc-500">Published:</span>{" "}
                {openDetail.publishedAt ? new Date(openDetail.publishedAt).toLocaleString() : "—"}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingPost(openDetail);
                  setOpenCreate(true);
                  setOpenDetail(null);
                }}
              >
                Редактировать
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(openDetail.id)}>
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} title="Подтвердите удаление" onClose={() => setConfirmDelete(null)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">Пост будет мягко удалён и пропадёт из ленты и календаря.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={() => confirmDelete && deletePost(confirmDelete)}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
