"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { CalendarDayGroup } from "@/types";

type Props = {
  items: CalendarDayGroup[];
  currentMonth: Date;
  onMonthChange: (nextMonth: Date) => void;
};

export function CalendarView({ items, currentMonth, onMonthChange }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  const map = useMemo(() => {
    const source = new Map<string, CalendarDayGroup>();
    items.forEach((item) => source.set(format(new Date(item.date), "yyyy-MM-dd"), item));
    return source;
  }, [items]);

  const selectedBucket = selectedDay
    ? map.get(format(selectedDay, "yyyy-MM-dd"))?.posts ?? []
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">{format(currentMonth, "LLLL yyyy")}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="secondary" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
          <div key={dayName} className="py-1">
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const bucket = map.get(key);
          const count = bucket?.count ?? 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`min-h-24 rounded-xl border p-2 text-left transition ${
                isSameMonth(day, currentMonth)
                  ? "border-zinc-800 bg-zinc-900 hover:border-zinc-500"
                  : "border-zinc-900 bg-zinc-950 text-zinc-600"
              }`}
            >
              <p className="text-xs">{format(day, "d")}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {count > 0 ? (
                  Array.from({ length: Math.min(count, 4) }).map((_, index) => (
                    <span key={index} className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-500">—</span>
                )}
              </div>
              {count > 0 && (
                <span className="mt-2 inline-block rounded-full bg-zinc-700/40 px-2 py-0.5 text-[10px] text-zinc-200">
                  {count} пост(ов)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedDay)}
        title={selectedDay ? `Посты на ${format(selectedDay, "dd.MM.yyyy")}` : ""}
        onClose={() => setSelectedDay(null)}
      >
        {selectedBucket.length === 0 && <p className="text-sm text-zinc-400">На эту дату постов нет.</p>}
        <div className="space-y-3">
          {selectedBucket.map((post) => (
            <div key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="font-medium text-zinc-100">{post.title}</p>
              <p className="text-xs text-zinc-400">
                {post.status} ·{" "}
                {post.scheduledAt ? format(new Date(post.scheduledAt), "dd.MM.yyyy HH:mm") : "без даты"}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
