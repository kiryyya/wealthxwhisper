"use client";

import { ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { EventCategory } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.notes.toLowerCase().includes(query),
    );
  }, [categories, search]);

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    await fetch("/api/event-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    await fetchCategories();
    setCreating(false);
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-100">Категории мероприятий</h1>
        <p className="text-sm text-zinc-400">
          Выберите категорию, чтобы открыть страницу с заметками.
        </p>
      </header>

      <form onSubmit={createCategory} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Новая категория..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newName.trim() || creating}>
          <Plus size={16} />
          Добавить
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию или заметкам..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <p className="col-span-full text-sm text-zinc-500">Загрузка категорий...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="col-span-full text-sm text-zinc-500">
            {search.trim() ? "Ничего не найдено." : "Категорий пока нет. Добавьте первую."}
          </p>
        )}
        {filtered.map((category) => (
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
    </section>
  );
}
