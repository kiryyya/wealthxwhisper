"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  onUploaded: () => void;
};

export function UploadMediaDialog({ onUploaded }: Props) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upload = async () => {
    if (!files || !files.length) {
      setError("Выберите хотя бы один файл.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/media", { method: "POST", body: formData });
    setLoading(false);

    if (!response.ok) {
      setError("Не удалось загрузить файлы.");
      return;
    }

    setFiles(null);
    onUploaded();
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-100">Загрузить изображение</h3>
      <p className="mb-3 text-xs text-zinc-400">
        Рекомендуемый формат для ленты Instagram: 1080x1350 px (4:5, вертикальный портрет).
      </p>
      <div className="space-y-3">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          className="w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-zinc-100"
        />
        {error && <p className="text-sm text-zinc-300">{error}</p>}
        <Button onClick={upload} disabled={loading}>
          {loading ? "Загрузка..." : "Загрузить изображение"}
        </Button>
      </div>
    </div>
  );
}
