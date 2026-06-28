"use client";

import { ArrowLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { EventCategory, EventCategorySection } from "@/types";

function sectionSubtitle(section: EventCategorySection) {
  if (section.description.trim()) return section.description;
  if (section.todosCount) {
    const open = section.openTodosCount ?? 0;
    return `${open} из ${section.todosCount} задач открыто`;
  }
  return "Описания и задач пока нет";
}

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [category, setCategory] = useState<EventCategory | null>(null);
  const [sections, setSections] = useState<EventCategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoryResponse, sectionsResponse] = await Promise.all([
        fetch(`/api/event-categories/${params.id}`),
        fetch(`/api/event-categories/${params.id}/sections`),
      ]);

      if (!categoryResponse.ok) throw new Error("Категория не найдена");

      const categoryData: EventCategory = await categoryResponse.json();
      const sectionsData = await sectionsResponse.json();

      setCategory(categoryData);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
      setCategory(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeCreate = () => {
    setCreateOpen(false);
    setNewName("");
  };

  const createSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    await fetch(`/api/event-categories/${params.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    closeCreate();
    await loadData();
    setCreating(false);
  };

  const removeCategory = async () => {
    if (!category) return;

    await fetch(`/api/event-categories/${category.id}`, { method: "DELETE" });
    router.push("/categories");
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка...</p>;
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft size={16} />
          Все категории
        </Link>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Добавить
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </header>

      <h1 className="text-2xl font-semibold text-zinc-100">{category.name}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.length === 0 && (
          <p className="col-span-full text-sm text-zinc-500">
            Разделов пока нет. Добавьте первый.
          </p>
        )}
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/categories/${category.id}/sections/${section.id}`}
            className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-medium text-zinc-100">{section.name}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                {sectionSubtitle(section)}
              </p>
            </div>
            <ChevronRight
              size={18}
              className="ml-3 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
            />
          </Link>
        ))}
      </div>

      <Modal open={createOpen} title="Новый раздел" onClose={closeCreate}>
        <form onSubmit={createSection} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-zinc-300">Название</span>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Например, подготовка"
              autoFocus
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeCreate}>
              Отмена
            </Button>
            <Button type="submit" disabled={!newName.trim() || creating}>
              Добавить
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={confirmDelete} title="Удалить категорию?" onClose={() => setConfirmDelete(false)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Категория «{category.name}» и все разделы будут удалены без восстановления.
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
