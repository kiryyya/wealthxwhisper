"use client";

import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderPlus,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { buildKnowledgeTree } from "@/lib/knowledge-base";
import type { KnowledgeBasePage } from "@/types";

type FlatPage = Omit<KnowledgeBasePage, "children">;

type TreeNodeProps = {
  node: KnowledgeBasePage;
  depth: number;
  selectedId: string | null;
  matchIds: Set<string>;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (page: KnowledgeBasePage) => void;
};

function TreeNode({
  node,
  depth,
  selectedId,
  matchIds,
  expandedIds,
  onSelect,
  onToggle,
  onAddChild,
  onDelete,
}: TreeNodeProps) {
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedIds.has(node.id);
  const isMatch = matchIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={clsx(
          "group flex items-center gap-1 rounded-lg pr-1 transition",
          isSelected ? "bg-zinc-700" : "hover:bg-zinc-800/80",
          isMatch && !isSelected && "ring-1 ring-zinc-600",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-500 hover:text-zinc-300"
          onClick={() => (hasChildren ? onToggle(node.id) : onSelect(node.id))}
          aria-label={hasChildren ? "Развернуть" : "Выбрать"}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <FileText size={14} />
          )}
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 truncate py-2 text-left text-sm text-zinc-100"
          onClick={() => onSelect(node.id)}
        >
          {node.title}
        </button>

        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
            onClick={() => onAddChild(node.id)}
            title="Добавить вложенную страницу"
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-red-300"
            onClick={() => onDelete(node)}
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              matchIds={matchIds}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeBasePanel() {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pages, setPages] = useState<FlatPage[]>([]);
  const [matchIds, setMatchIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBasePage | null>(null);

  const tree = useMemo(() => buildKnowledgeTree(pages), [pages]);
  const selectedPage = pages.find((page) => page.id === selectedId) ?? null;

  const fetchPages = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);

    try {
      const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const response = await fetch(`/api/knowledge-base${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error("Не удалось загрузить базу знаний");

      const nextPages: FlatPage[] = Array.isArray(data.pages) ? data.pages : [];
      setPages(nextPages);
      setMatchIds(new Set(Array.isArray(data.matchIds) ? data.matchIds : []));

      setSelectedId((current) =>
        current && !nextPages.some((page) => page.id === current) ? null : current,
      );

      if (query.trim()) {
        setExpandedIds(new Set(nextPages.map((page) => page.id)));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPage = useCallback(async (id: string) => {
    const response = await fetch(`/api/knowledge-base/${id}`);
    if (!response.ok) return;

    const page: FlatPage = await response.json();
    setTitle(page.title);
    setContent(page.content);
    setDirty(false);
  }, []);

  useEffect(() => {
    fetchPages("");
  }, [fetchPages]);

  useEffect(() => {
    if (!selectedId) {
      setTitle("");
      setContent("");
      setDirty(false);
      return;
    }

    loadPage(selectedId);
  }, [selectedId, loadPage]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPages(value);
    }, 300);
  };

  const savePage = useCallback(
    async (payload?: { title: string; content: string }) => {
      if (!selectedId) return;

      const data = payload ?? { title, content };
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/knowledge-base/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) throw new Error("Не удалось сохранить");

        setPages((current) =>
          current.map((page) => (page.id === result.id ? { ...page, ...result } : page)),
        );
        setTitle(result.title);
        setContent(result.content);
        setDirty(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [selectedId, title, content],
  );

  const scheduleSave = (nextTitle: string, nextContent: string) => {
    setDirty(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePage({ title: nextTitle, content: nextContent });
    }, 900);
  };

  const openCreate = (parentId: string | null = null) => {
    setCreateParentId(parentId);
    setCreateTitle("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateTitle("");
    setCreateParentId(null);
  };

  const createPage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createTitle.trim() || creating) return;

    setCreating(true);
    const response = await fetch("/api/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createTitle.trim(),
        parentId: createParentId,
      }),
    });

    if (response.ok) {
      const page: FlatPage = await response.json();
      closeCreate();
      await fetchPages(search);
      setSelectedId(page.id);
      if (createParentId) {
        setExpandedIds((current) => new Set([...current, createParentId]));
      }
    }

    setCreating(false);
  };

  const removePage = async () => {
    if (!deleteTarget) return;

    await fetch(`/api/knowledge-base/${deleteTarget.id}`, { method: "DELETE" });

    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
    }

    setDeleteTarget(null);
    await fetchPages(search);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="-mx-4 -my-5 flex min-h-[calc(100dvh-1rem)] flex-col sm:-mx-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Поиск по названию и содержимому..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => openCreate(null)}>
          <Plus size={16} />
          Страница
        </Button>
      </div>

      {error && (
        <p className="mx-4 mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300 sm:mx-6">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-zinc-800 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="max-h-64 overflow-y-auto p-3 lg:max-h-none lg:h-full">
            {loading && <p className="text-sm text-zinc-500">Загрузка...</p>}
            {!loading && tree.length === 0 && (
              <p className="text-sm text-zinc-500">
                {search.trim() ? "Ничего не найдено." : "Страниц пока нет. Создайте первую."}
              </p>
            )}
            {!loading &&
              tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  matchIds={matchIds}
                  expandedIds={expandedIds}
                  onSelect={setSelectedId}
                  onToggle={toggleExpanded}
                  onAddChild={openCreate}
                  onDelete={setDeleteTarget}
                />
              ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-6">
          {!selectedPage && (
            <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
              Выберите страницу слева или создайте новую.
            </div>
          )}

          {selectedPage && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="block min-w-0 flex-1 space-y-2">
                  <span className="text-sm text-zinc-300">Заголовок</span>
                  <Input
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      scheduleSave(event.target.value, content);
                    }}
                  />
                </label>
                <div className="flex gap-2 pt-6">
                  <Button
                    variant="secondary"
                    onClick={() => savePage()}
                    disabled={saving || !dirty}
                  >
                    <Save size={16} />
                    {saving ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleteTarget(selectedPage)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-zinc-300">Содержимое</span>
                <textarea
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    scheduleSave(title, event.target.value);
                  }}
                  placeholder="Текст страницы..."
                  className="min-h-[420px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm leading-6 text-zinc-100 outline-none ring-zinc-500 placeholder:text-zinc-500 focus:ring-2"
                />
              </label>

              <p className="text-xs text-zinc-500">
                {dirty && !saving && "Сохраняется автоматически..."}
                {saving && "Сохранение..."}
                {!dirty && !saving && selectedPage.updatedAt && (
                  <>Обновлено: {new Date(selectedPage.updatedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal open={createOpen} title="Новая страница" onClose={closeCreate}>
        <form onSubmit={createPage} className="space-y-4">
          {createParentId && (
            <p className="text-sm text-zinc-400">
              Вложенная страница в «
              {pages.find((page) => page.id === createParentId)?.title ?? "раздел"}»
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-sm text-zinc-300">Название</span>
            <Input
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              placeholder="Например, онбординг"
              autoFocus
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeCreate}>
              Отмена
            </Button>
            <Button type="submit" disabled={!createTitle.trim() || creating}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="Удалить страницу?" onClose={() => setDeleteTarget(null)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Страница «{deleteTarget?.title}» и все вложенные страницы будут удалены без
            восстановления.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={removePage}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
