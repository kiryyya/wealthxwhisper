"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { TestRecord } from "@/types";

export default function RecordsPage() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [search, setSearch] = useState("");
  const [newText, setNewText] = useState("");
  const [editing, setEditing] = useState<TestRecord | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async (query = search) => {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    const response = await fetch(`/api/test-records${params}`);
    const data = await response.json();
    setRecords(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRecords(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchRecords]);

  const createRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newText.trim()) return;

    await fetch("/api/test-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText.trim() }),
    });

    setNewText("");
    await fetchRecords();
  };

  const openEdit = (record: TestRecord) => {
    setEditing(record);
    setEditText(record.text);
  };

  const saveEdit = async () => {
    if (!editing || !editText.trim()) return;

    await fetch(`/api/test-records/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });

    setEditing(null);
    await fetchRecords();
  };

  const removeRecord = async (id: string) => {
    await fetch(`/api/test-records/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await fetchRecords();
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-100">Тестовые записи</h1>
        <p className="text-sm text-zinc-400">
          Таблица с CRUD-операциями и поиском по текстовому полю.
        </p>
      </header>

      <form onSubmit={createRecord} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={newText}
          onChange={(event) => setNewText(event.target.value)}
          placeholder="Новая запись..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newText.trim()}>
          Добавить
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по тексту..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Текст</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Создано</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                  Загрузка...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                  {search.trim() ? "Ничего не найдено." : "Записей пока нет."}
                </td>
              </tr>
            )}
            {!loading &&
              records.map((record) => (
                <tr key={record.id} className="border-b border-zinc-800/80 last:border-b-0">
                  <td className="px-4 py-3 text-zinc-100">{record.text}</td>
                  <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(record)} title="Редактировать">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" onClick={() => setDeleteId(record.id)} title="Удалить">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} title="Редактировать запись" onClose={() => setEditing(null)}>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-zinc-300">Текст</span>
            <Input value={editText} onChange={(event) => setEditText(event.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={saveEdit} disabled={!editText.trim()}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(deleteId)} title="Удалить запись?" onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">Запись будет удалена без возможности восстановления.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={() => deleteId && removeRecord(deleteId)}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
