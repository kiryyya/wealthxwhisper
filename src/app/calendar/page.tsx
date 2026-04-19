"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { CalendarView } from "@/components/calendar/CalendarView";
import type { CalendarDayGroup } from "@/types";

type CalendarPost = {
  id: string;
  title: string;
  status: "scheduled" | "published";
  scheduledAt: string | null;
  positionIndex: number;
};

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);

  useEffect(() => {
    fetch(`/api/calendar?month=${month.toISOString()}`)
      .then((response) => response.json())
      .then((data) => setPosts(data));
  }, [month]);

  const groups = useMemo<CalendarDayGroup[]>(() => {
    const map = new Map<string, CalendarDayGroup>();

    posts.forEach((post) => {
      if (!post.scheduledAt) return;
      const key = format(new Date(post.scheduledAt), "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, { date: key, count: 0, posts: [] });
      }
      const bucket = map.get(key)!;
      bucket.posts.push(post);
      bucket.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [posts]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Календарь</h1>
        <p className="text-sm text-zinc-400">
          Месячный обзор запланированных/опубликованных постов ({format(startOfMonth(month), "dd.MM")} -{" "}
          {format(endOfMonth(month), "dd.MM")}).
        </p>
      </header>
      <CalendarView items={groups} currentMonth={month} onMonthChange={setMonth} />
    </section>
  );
}
