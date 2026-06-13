"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { RoadmapCanvasData, RoadmapCard } from "@/types";

const CARD_COLORS = ["#3f3f46", "#365314", "#1e3a5f", "#581c87", "#7f1d1d"];
const DEFAULT_CARD: Omit<RoadmapCard, "id"> = {
  text: "Новая задача",
  x: 80,
  y: 80,
  width: 220,
  height: 130,
  color: CARD_COLORS[0],
};

function createCard(index: number): RoadmapCard {
  return {
    id: crypto.randomUUID(),
    ...DEFAULT_CARD,
    x: 60 + (index % 4) * 40,
    y: 60 + (index % 4) * 40,
    color: CARD_COLORS[index % CARD_COLORS.length],
  };
}

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
};

export function RoadmapCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<RoadmapCard[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadCanvas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/roadmap");
      if (!response.ok) throw new Error("Не удалось загрузить roadmap");
      const data: RoadmapCanvasData = await response.json();
      setItems(data.items);
      setLastSaved(new Date(data.updatedAt));
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);

  const saveCanvas = useCallback(async (nextItems: RoadmapCard[]) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems }),
      });
      if (!response.ok) throw new Error("Не удалось сохранить roadmap");
      const data: RoadmapCanvasData = await response.json();
      setItems(data.items);
      setLastSaved(new Date(data.updatedAt));
      setDirty(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, []);

  const addCard = () => {
    setItems((prev) => [...prev, createCard(prev.length)]);
    setDirty(true);
  };

  const updateCard = (id: string, patch: Partial<RoadmapCard>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setDirty(true);
  };

  const removeCard = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDirty(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, card: RoadmapCard) => {
    if ((event.target as HTMLElement).closest("textarea,button")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setDragging({
      id: card.id,
      offsetX: event.clientX - rect.left - card.x,
      offsetY: event.clientY - rect.top - card.y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const card = items.find((item) => item.id === dragging.id);
    if (!card) return;

    const nextX = Math.max(0, Math.min(event.clientX - rect.left - dragging.offsetX, rect.width - card.width));
    const nextY = Math.max(0, Math.min(event.clientY - rect.top - dragging.offsetY, rect.height - card.height));

    setItems((prev) =>
      prev.map((item) =>
        item.id === dragging.id
          ? {
              ...item,
              x: nextX,
              y: nextY,
            }
          : item,
      ),
    );
    setDirty(true);
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">
            Перетаскивайте карточки по холсту. Изменения сохраняются в базу данных.
          </p>
          {lastSaved && (
            <p className="text-xs text-zinc-500">
              Последнее сохранение: {lastSaved.toLocaleString()}
              {dirty && " · есть несохранённые изменения"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={addCard} disabled={loading}>
            <Plus size={16} />
            Добавить
          </Button>
          <Button onClick={() => saveCanvas(items)} disabled={loading || saving || !dirty}>
            <Save size={16} />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(113,113,122,0.35) 1px, transparent 1px), radial-gradient(circle, rgba(113,113,122,0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px, 24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 text-sm text-zinc-400">
            Загрузка холста...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Холст пуст. Нажмите «Добавить», чтобы создать первую карточку.
          </div>
        )}

        {items.map((card) => (
          <div
            key={card.id}
            onPointerDown={(event) => handlePointerDown(event, card)}
            className="absolute flex flex-col rounded-xl border border-zinc-700/80 shadow-lg"
            style={{
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
              backgroundColor: card.color,
              cursor: dragging?.id === card.id ? "grabbing" : "grab",
              touchAction: "none",
              zIndex: dragging?.id === card.id ? 20 : 10,
            }}
          >
            <div className="flex items-center justify-between border-b border-black/20 px-2 py-1">
              <span className="text-[10px] uppercase tracking-wide text-zinc-200/80">Roadmap</span>
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="rounded p-1 text-zinc-200/80 transition hover:bg-black/20 hover:text-zinc-100"
                title="Удалить"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              value={card.text}
              onChange={(event) => updateCard(card.id, { text: event.target.value })}
              className="h-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-300/60"
              placeholder="Опишите этап..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
