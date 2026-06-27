"use client";

import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { EventCategory } from "@/types";

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [category, setCategory] = useState<EventCategory | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadCategory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/event-categories/${params.id}`);
      if (!response.ok) throw new Error("Категория не найдена");
      const data: EventCategory = await response.json();
      setCategory(data);
      setName(data.name);
      setNotes(data.notes);
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadCategory();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [loadCategory]);

  const saveCategory = useCallback(
    async (payload?: { name: string; notes: string }) => {
      if (!category) return;

      const data = payload ?? { name, notes };
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/event-categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) throw new Error("Не удалось сохранить");

        setCategory(result);
        setName(result.name);
        setNotes(result.notes);
        setDirty(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [category, name, notes],
  );

  const scheduleSave = (nextName: string, nextNotes: string) => {
    setDirty(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCategory({ name: nextName, notes: nextNotes });
    }, 900);
  };

  const removeCategory = async () => {
    if (!category) return;

    await fetch(`/api/event-categories/${category.id}`, { method: "DELETE" });
    router.push("/categories");
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка категории...</p>;
  }

  if (!category) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-300">{error || "Категория не найдена"}</p>
        <Link href="/categories" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Назад к списку
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            <ArrowLeft size={16} />
            Все категории
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-100">Категория</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => saveCategory()} disabled={saving || !dirty}>
            <Save size={16} />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <label className="block space-y-2">
        <span className="text-sm text-zinc-300">Название</span>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            scheduleSave(event.target.value, notes);
          }}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-zinc-300">Заметки</span>
        <textarea
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            scheduleSave(name, event.target.value);
          }}
          placeholder="Опишите особенности мероприятий в этой категории..."
          className="min-h-[320px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 placeholder:text-zinc-500 focus:ring-2"
        />
      </label>

      <p className="text-xs text-zinc-500">
        {dirty && !saving && "Сохраняется автоматически..."}
        {saving && "Сохранение..."}
        {!dirty && !saving && category.updatedAt && (
          <>Обновлено: {new Date(category.updatedAt).toLocaleString()}</>
        )}
      </p>

      <Modal open={confirmDelete} title="Удалить категорию?" onClose={() => setConfirmDelete(false)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Категория «{category.name}» и все заметки будут удалены без восстановления.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={removeCategory}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
