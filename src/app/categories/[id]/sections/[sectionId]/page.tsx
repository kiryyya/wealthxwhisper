"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { EventCategorySection, EventCategorySectionTodo } from "@/types";

export default function CategorySectionPage() {
  const params = useParams<{ id: string; sectionId: string }>();
  const router = useRouter();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [section, setSection] = useState<EventCategorySection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [todos, setTodos] = useState<EventCategorySectionTodo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadSection = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/event-categories/${params.id}/sections/${params.sectionId}`,
      );
      if (!response.ok) throw new Error("Раздел не найден");

      const data: EventCategorySection = await response.json();
      setSection(data);
      setName(data.name);
      setDescription(data.description);
      setTodos(data.todos ?? []);
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
      setSection(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, params.sectionId]);

  useEffect(() => {
    loadSection();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [loadSection]);

  const saveSection = useCallback(
    async (payload?: { name: string; description: string }) => {
      if (!section) return;

      const data = payload ?? { name, description };
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/event-categories/${params.id}/sections/${section.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );

        const result = await response.json();
        if (!response.ok) throw new Error("Не удалось сохранить");

        setSection(result);
        setName(result.name);
        setDescription(result.description);
        setTodos(result.todos ?? []);
        setDirty(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [section, name, description, params.id],
  );

  const scheduleSave = (nextName: string, nextDescription: string) => {
    setDirty(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSection({ name: nextName, description: nextDescription });
    }, 900);
  };

  const addTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTodo.trim() || !section) return;

    const response = await fetch(
      `/api/event-categories/${params.id}/sections/${section.id}/todos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo.trim() }),
      },
    );

    if (response.ok) {
      const todo: EventCategorySectionTodo = await response.json();
      setTodos((current) => [...current, todo]);
      setNewTodo("");
    }
  };

  const toggleTodo = async (todo: EventCategorySectionTodo) => {
    const response = await fetch(
      `/api/event-categories/${params.id}/sections/${params.sectionId}/todos/${todo.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      },
    );

    if (response.ok) {
      const updated: EventCategorySectionTodo = await response.json();
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const removeTodo = async (todoId: string) => {
    const response = await fetch(
      `/api/event-categories/${params.id}/sections/${params.sectionId}/todos/${todoId}`,
      { method: "DELETE" },
    );

    if (response.ok) {
      setTodos((current) => current.filter((item) => item.id !== todoId));
    }
  };

  const removeSection = async () => {
    if (!section) return;

    await fetch(`/api/event-categories/${params.id}/sections/${section.id}`, {
      method: "DELETE",
    });
    router.push(`/categories/${params.id}`);
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка раздела...</p>;
  }

  if (!section) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-300">{error || "Раздел не найден"}</p>
        <Link
          href={`/categories/${params.id}`}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Назад к категории
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href={`/categories/${params.id}`}
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            <ArrowLeft size={16} />
            К категории
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => saveSection()} disabled={saving || !dirty}>
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
        <span className="text-sm text-zinc-300">Название раздела</span>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            scheduleSave(event.target.value, description);
          }}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-zinc-300">Описание</span>
        <textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            scheduleSave(name, event.target.value);
          }}
          placeholder="Опишите раздел..."
          className="min-h-[200px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 placeholder:text-zinc-500 focus:ring-2"
        />
      </label>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Список задач</h2>

        <ul className="space-y-2">
          {todos.length === 0 && (
            <li className="text-sm text-zinc-500">Задач пока нет.</li>
          )}
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo)}
                className="size-4 rounded border-zinc-600 bg-zinc-900"
              />
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? "text-zinc-500 line-through" : "text-zinc-100"
                }`}
              >
                {todo.text}
              </span>
              <Button variant="ghost" onClick={() => removeTodo(todo.id)} title="Удалить">
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={addTodo} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Новая задача..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newTodo.trim()}>
            <Plus size={16} />
            Добавить
          </Button>
        </form>
      </div>

      <p className="text-xs text-zinc-500">
        {dirty && !saving && "Сохраняется автоматически..."}
        {saving && "Сохранение..."}
        {!dirty && !saving && section.updatedAt && (
          <>Обновлено: {new Date(section.updatedAt).toLocaleString()}</>
        )}
      </p>

      <Modal open={confirmDelete} title="Удалить раздел?" onClose={() => setConfirmDelete(false)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Раздел «{section.name}» и все задачи будут удалены без восстановления.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={removeSection}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
