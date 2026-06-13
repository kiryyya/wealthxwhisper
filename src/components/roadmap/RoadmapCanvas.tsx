"use client";

import { Link2, MousePointer2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import type { RoadmapCanvasData, RoadmapCard, RoadmapEdge } from "@/types";

const CARD_COLORS = ["#3f3f46", "#365314", "#1e3a5f", "#581c87", "#7f1d1d"];
const DEFAULT_CARD: Omit<RoadmapCard, "id"> = {
  text: "Новая задача",
  x: 80,
  y: 80,
  width: 220,
  height: 130,
  color: CARD_COLORS[0],
};

type CanvasMode = "move" | "connect";
type DragState = { id: string; offsetX: number; offsetY: number };

function createCard(index: number): RoadmapCard {
  return {
    id: crypto.randomUUID(),
    ...DEFAULT_CARD,
    x: 60 + (index % 4) * 40,
    y: 60 + (index % 4) * 40,
    color: CARD_COLORS[index % CARD_COLORS.length],
  };
}

function cardCenter(card: RoadmapCard) {
  return { x: card.x + card.width / 2, y: card.y + card.height / 2 };
}

function edgePath(from: RoadmapCard, to: RoadmapCard) {
  const start = cardCenter(from);
  const end = cardCenter(to);
  const dx = Math.abs(end.x - start.x) * 0.5;
  return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
}

export function RoadmapCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ cards: [] as RoadmapCard[], edges: [] as RoadmapEdge[] });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cards, setCards] = useState<RoadmapCard[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [mode, setMode] = useState<CanvasMode>("move");
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  stateRef.current = { cards, edges };

  const persistCanvas = useCallback(
    async (payload: { cards: RoadmapCard[]; edges: RoadmapEdge[] }) => {
      stateRef.current = payload;
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/roadmap", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ? JSON.stringify(result.error) : "Не удалось сохранить roadmap");
        }

        const saved = result as RoadmapCanvasData;
        setCards(saved.cards);
        setEdges(saved.edges);
        stateRef.current = { cards: saved.cards, edges: saved.edges };
        setLastSaved(new Date(saved.updatedAt));
        setDirty(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const commitChange = useCallback(
    (nextCards: RoadmapCard[], nextEdges: RoadmapEdge[]) => {
      setCards(nextCards);
      setEdges(nextEdges);
      stateRef.current = { cards: nextCards, edges: nextEdges };
      setDirty(true);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistCanvas({ cards: nextCards, edges: nextEdges });
      }, 900);
    },
    [persistCanvas],
  );

  const saveCanvas = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await persistCanvas(stateRef.current);
  }, [persistCanvas]);

  const loadCanvas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/roadmap");
      if (!response.ok) throw new Error("Не удалось загрузить roadmap");
      const data: RoadmapCanvasData = await response.json();
      setCards(data.cards);
      setEdges(data.edges);
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
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [loadCanvas]);

  const addCard = () => {
    commitChange([...cards, createCard(cards.length)], edges);
  };

  const updateCard = (id: string, patch: Partial<RoadmapCard>) => {
    commitChange(
      cards.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      edges,
    );
  };

  const removeCard = (id: string) => {
    if (connectFromId === id) setConnectFromId(null);
    commitChange(
      cards.filter((item) => item.id !== id),
      edges.filter((edge) => edge.fromId !== id && edge.toId !== id),
    );
  };

  const removeEdge = (id: string) => {
    commitChange(
      cards,
      edges.filter((edge) => edge.id !== id),
    );
  };

  const handleConnectClick = (cardId: string) => {
    if (!connectFromId) {
      setConnectFromId(cardId);
      return;
    }

    if (connectFromId === cardId) {
      setConnectFromId(null);
      return;
    }

    const exists = edges.some(
      (edge) =>
        (edge.fromId === connectFromId && edge.toId === cardId) ||
        (edge.fromId === cardId && edge.toId === connectFromId),
    );

    if (!exists) {
      commitChange(cards, [...edges, { id: crypto.randomUUID(), fromId: connectFromId, toId: cardId }]);
    }

    setConnectFromId(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, card: RoadmapCard) => {
    if (mode !== "move") return;
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
    const card = cards.find((item) => item.id === dragging.id);
    if (!card) return;

    const nextX = Math.max(0, Math.min(event.clientX - rect.left - dragging.offsetX, rect.width - card.width));
    const nextY = Math.max(0, Math.min(event.clientY - rect.top - dragging.offsetY, rect.height - card.height));

    setCards((prev) => {
      const nextCards = prev.map((item) =>
        item.id === dragging.id ? { ...item, x: nextX, y: nextY } : item,
      );
      stateRef.current = { cards: nextCards, edges: stateRef.current.edges };
      return nextCards;
    });
    setDirty(true);
  };

  const handlePointerUp = () => {
    if (dragging) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistCanvas(stateRef.current);
      }, 300);
    }
    setDragging(null);
  };

  const cardById = (id: string) => cards.find((card) => card.id === id);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">
            Режим «Связь»: кликните блок-источник, затем блок-цель. Сохранение — автоматически.
          </p>
          {lastSaved && (
            <p className="text-xs text-zinc-500">
              Последнее сохранение: {lastSaved.toLocaleString()}
              {dirty && !saving && " · сохраняется..."}
              {saving && " · сохранение..."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "move" ? "primary" : "secondary"}
            onClick={() => {
              setMode("move");
              setConnectFromId(null);
            }}
          >
            <MousePointer2 size={16} />
            Перемещение
          </Button>
          <Button
            variant={mode === "connect" ? "primary" : "secondary"}
            onClick={() => {
              setMode("connect");
              setConnectFromId(null);
            }}
          >
            <Link2 size={16} />
            Связь
          </Button>
          <Button variant="secondary" onClick={addCard} disabled={loading}>
            <Plus size={16} />
            Добавить
          </Button>
          <Button onClick={() => saveCanvas()} disabled={loading || saving}>
            <Save size={16} />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

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
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/60 text-sm text-zinc-400">
            Загрузка холста...
          </div>
        )}

        {!loading && cards.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-zinc-500">
            Холст пуст. Нажмите «Добавить», чтобы создать первую карточку.
          </div>
        )}

        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {edges.map((edge) => {
            const from = cardById(edge.fromId);
            const to = cardById(edge.toId);
            if (!from || !to) return null;
            return (
              <path
                key={edge.id}
                d={edgePath(from, to)}
                fill="none"
                stroke="rgba(161,161,170,0.9)"
                strokeWidth={2}
                markerEnd="url(#roadmap-arrow)"
              />
            );
          })}
          <defs>
            <marker id="roadmap-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(161,161,170,0.9)" />
            </marker>
          </defs>
        </svg>

        {edges.map((edge) => {
          const from = cardById(edge.fromId);
          const to = cardById(edge.toId);
          if (!from || !to) return null;
          const start = cardCenter(from);
          const end = cardCenter(to);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          return (
            <button
              key={`${edge.id}-delete`}
              type="button"
              onClick={() => removeEdge(edge.id)}
              className="absolute z-20 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-[10px] text-zinc-300 hover:bg-zinc-700"
              style={{ left: midX, top: midY }}
              title="Удалить связь"
            >
              ×
            </button>
          );
        })}

        {cards.map((card) => (
          <div
            key={card.id}
            onPointerDown={(event) => handlePointerDown(event, card)}
            onClick={() => mode === "connect" && handleConnectClick(card.id)}
            className={clsx(
              "absolute flex flex-col rounded-xl border shadow-lg transition",
              mode === "connect" && connectFromId === card.id
                ? "border-amber-400 ring-2 ring-amber-400/60"
                : "border-zinc-700/80",
            )}
            style={{
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
              backgroundColor: card.color,
              cursor: mode === "connect" ? "crosshair" : dragging?.id === card.id ? "grabbing" : "grab",
              touchAction: mode === "move" ? "none" : "auto",
              zIndex: dragging?.id === card.id ? 20 : 10,
            }}
          >
            <div className="flex items-center justify-between border-b border-black/20 px-2 py-1">
              <span className="text-[10px] uppercase tracking-wide text-zinc-200/80">Roadmap</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeCard(card.id);
                }}
                className="rounded p-1 text-zinc-200/80 transition hover:bg-black/20 hover:text-zinc-100"
                title="Удалить"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              value={card.text}
              onChange={(event) => updateCard(card.id, { text: event.target.value })}
              onClick={(event) => event.stopPropagation()}
              className="h-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-300/60"
              placeholder="Опишите этап..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
