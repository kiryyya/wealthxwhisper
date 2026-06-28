"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { EventCategory } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/event-categories");
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const closeCreate = () => {
    setCreateOpen(false);
    setNewName("");
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    await fetch("/api/event-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    closeCreate();
    await fetchCategories();
    setCreating(false);
  };

  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Добавить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <p className="col-span-full text-sm text-zinc-500">Загрузка категорий...</p>
        )}
        {!loading && categories.length === 0 && (
          <p className="col-span-full text-sm text-zinc-500">
            Категорий пока нет. Добавьте первую.
          </p>
        )}
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-medium text-zinc-100">{category.name}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                {category.notes.trim() || "Заметок пока нет"}
              </p>
            </div>
            <ChevronRight
              size={18}
              className="ml-3 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
            />
          </Link>
        ))}
      </div>

      <Modal open={createOpen} title="Новая категория" onClose={closeCreate}>
        <form onSubmit={createCategory} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-zinc-300">Название</span>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Например, конференция"
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
    </section>
  );
}
