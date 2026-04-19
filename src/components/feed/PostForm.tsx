"use client";

import Image from "next/image";
import { PostStatus, type MediaAsset } from "@prisma/client";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { MAX_POST_MEDIA } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { isRecommendedInstagramPortrait } from "@/lib/media";
import type { PostWithMedia, UpsertPostPayload } from "@/types";

type PostFormProps = {
  mediaCatalog: MediaAsset[];
  initialPost?: PostWithMedia | null;
  onCancel: () => void;
  onSaved: () => void;
};

export function PostForm({ mediaCatalog, initialPost, onCancel, onSaved }: PostFormProps) {
  const initialMedia = initialPost?.media.map((item) => item.mediaAsset) ?? [];
  const baseMedia = initialPost ? initialMedia : mediaCatalog;
  const mergedInitialMedia = [...baseMedia, ...initialMedia].reduce<MediaAsset[]>((acc, asset) => {
    if (!acc.find((item) => item.id === asset.id)) {
      acc.push(asset);
    }
    return acc;
  }, []);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [caption, setCaption] = useState(initialPost?.caption ?? "");
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? PostStatus.draft);
  const [scheduledAt, setScheduledAt] = useState(
    initialPost?.scheduledAt ? new Date(initialPost.scheduledAt).toISOString().slice(0, 16) : "",
  );
  const [positionIndex, setPositionIndex] = useState(initialPost?.positionIndex ?? 0);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>(
    initialPost?.media.map((item) => item.mediaAssetId) ?? [],
  );
  const [availableMedia, setAvailableMedia] = useState<MediaAsset[]>(mergedInitialMedia);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedAssets = useMemo(
    () =>
      selectedMediaIds
        .map((id) => availableMedia.find((asset) => asset.id === id))
        .filter(Boolean) as MediaAsset[],
    [availableMedia, selectedMediaIds],
  );

  const toggleMedia = (id: string) => {
    setSelectedMediaIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_POST_MEDIA) {
        setError("Можно выбрать максимум 10 изображений для карусели.");
        return prev;
      }
      setError("");
      return [...prev, id];
    });
  };

  const moveSelected = (index: number, direction: "up" | "down") => {
    setSelectedMediaIds((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title обязателен");
      return;
    }

    if (selectedMediaIds.length > MAX_POST_MEDIA) {
      setError("Превышен лимит 10 изображений.");
      return;
    }
    if (selectedMediaIds.length === 0) {
      setError("Выберите хотя бы одно изображение для поста.");
      return;
    }

    setLoading(true);
    setError("");

    const payload: UpsertPostPayload = {
      title: title.trim(),
      caption: caption.trim() || null,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      publishedAt: status === PostStatus.published ? new Date().toISOString() : null,
      positionIndex,
      mediaAssetIds: selectedMediaIds,
    };

    const url = initialPost ? `/api/posts/${initialPost.id}` : "/api/posts";
    const method = initialPost ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!response.ok) {
      setError("Не удалось сохранить пост.");
      return;
    }

    onSaved();
  };

  const uploadMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/media", { method: "POST", body: formData });
    setUploading(false);
    event.target.value = "";

    if (!response.ok) {
      setError("Не удалось загрузить изображения.");
      return;
    }
    const created = (await response.json()) as MediaAsset[];
    setAvailableMedia((prev) => {
      const next = [...prev];
      created.forEach((asset) => {
        if (!next.find((item) => item.id === asset.id)) {
          next.push(asset);
        }
      });
      return next;
    });
    setSelectedMediaIds((prev) => {
      const next = [...prev];
      created.forEach((asset) => {
        if (!next.includes(asset.id) && next.length < MAX_POST_MEDIA) {
          next.push(asset.id);
        }
      });
      return next;
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-zinc-300">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-zinc-300">Position index</span>
          <Input
            type="number"
            min={0}
            value={positionIndex}
            onChange={(e) => setPositionIndex(Number(e.target.value))}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">Caption</span>
        <textarea
          className="min-h-20 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-zinc-300">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
          >
            {Object.values(PostStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-zinc-300">Scheduled at</span>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-800 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-100">Выбор изображений ({selectedMediaIds.length}/10)</p>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-600">
            {uploading ? "Загрузка..." : "Загрузить изображения"}
            <input type="file" accept="image/*" multiple onChange={uploadMedia} className="hidden" />
          </label>
        </div>
        <p className="text-[11px] text-zinc-400">
          Оптимально: 1080x1350 px (4:5). В сетке ленты фото отображается в вертикальном формате 4:5.
        </p>
        {availableMedia.length === 0 && (
          <p className="text-xs text-zinc-400">
            Пока нет доступных изображений. Загрузите их кнопкой справа.
          </p>
        )}
        <div className="grid max-h-52 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {availableMedia.map((asset) => {
            const selected = selectedMediaIds.includes(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => toggleMedia(asset.id)}
                className={`relative aspect-square overflow-hidden rounded-lg border text-left text-xs ${
                  selected
                    ? "border-zinc-500 bg-zinc-700/30 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300"
                }`}
              >
                <Image
                  src={asset.url}
                  alt={asset.altText || asset.title || asset.storagePath}
                  fill
                  sizes="(max-width: 768px) 45vw, 120px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1">
                  <p className="truncate text-[11px]">{asset.title || asset.storagePath}</p>
                  {!isRecommendedInstagramPortrait(asset.width, asset.height) && (
                    <p className="truncate text-[10px] text-zinc-300/90">не 4:5 (1080x1350)</p>
                  )}
                </div>
                {selected && (
                  <div className="absolute right-1 top-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-900">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-800 p-3">
        <p className="text-sm font-medium text-zinc-100">Порядок карусели</p>
        {selectedAssets.length === 0 && <p className="text-xs text-zinc-400">Не выбраны изображения.</p>}
        <div className="space-y-2">
          {selectedAssets.map((asset, index) => (
            <div key={asset.id} className="flex items-center justify-between rounded-lg bg-zinc-800/70 px-3 py-2">
              <p className="truncate text-sm text-zinc-200">
                {index + 1}. {asset.title || asset.storagePath}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => moveSelected(index, "up")}>
                  Вверх
                </Button>
                <Button type="button" variant="ghost" onClick={() => moveSelected(index, "down")}>
                  Вниз
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-zinc-300">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
