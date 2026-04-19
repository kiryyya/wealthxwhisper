"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadMediaDialog } from "@/components/media/UploadMediaDialog";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/format";
import type { MediaAssetWithPosts, UpdateMediaPayload } from "@/types";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaAssetWithPosts[]>([]);
  const [current, setCurrent] = useState<MediaAssetWithPosts | null>(null);
  const [form, setForm] = useState({ title: "", altText: "", tags: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMedia = async () => {
    const response = await fetch("/api/media");
    const data = await response.json();
    setMedia(data);
  };

  useEffect(() => {
    fetch("/api/media")
      .then((response) => response.json())
      .then((data) => setMedia(data));
  }, []);

  const openMedia = (asset: MediaAssetWithPosts) => {
    setCurrent(asset);
    setForm({
      title: asset.title || "",
      altText: asset.altText || "",
      tags: asset.tags.join(", "),
    });
  };

  const saveMeta = async () => {
    if (!current) return;
    const payload: UpdateMediaPayload = {
      title: form.title || null,
      altText: form.altText || null,
      tags: form.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };
    await fetch(`/api/media/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchMedia();
    setCurrent(null);
  };

  const removeMedia = async (id: string) => {
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setDeleteId(null);
    if (current?.id === id) setCurrent(null);
    fetchMedia();
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-100">Каталог изображений</h1>
        <p className="text-sm text-zinc-400">
          Библиотека всех MediaAsset с пакетной загрузкой, редактированием и soft-delete.
        </p>
      </header>

      <UploadMediaDialog onUploaded={fetchMedia} />

      <MediaGrid media={media} onOpen={openMedia} onDelete={setDeleteId} />

      <Modal open={Boolean(current)} title="Детальный просмотр медиа" onClose={() => setCurrent(null)}>
        {current && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800">
              <Image src={current.url} alt={current.altText || current.title || "Media"} fill className="object-contain" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-zinc-300">Title</span>
                <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-zinc-300">Alt text</span>
                <Input value={form.altText} onChange={(e) => setForm((prev) => ({ ...prev, altText: e.target.value }))} />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm text-zinc-300">Tags (comma separated)</span>
              <Input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />
            </label>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
              <p>
                {current.width}x{current.height} · {current.format.toUpperCase()} · {formatBytes(current.sizeBytes)}
              </p>
              <p className="text-zinc-400">Создано: {new Date(current.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-zinc-200">Используется в постах:</p>
              <ul className="mt-1 space-y-1 text-xs text-zinc-400">
                {current.postMedia.length === 0 && <li>Пока не используется.</li>}
                {current.postMedia.map((relation) => (
                  <li key={relation.id}>• {relation.post.title}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCurrent(null)}>
                Отмена
              </Button>
              <Button onClick={saveMeta}>Сохранить</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(deleteId)} title="Удалить изображение?" onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">Изображение будет мягко удалено из каталога.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={() => deleteId && removeMedia(deleteId)}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
