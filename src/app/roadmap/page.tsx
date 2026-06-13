"use client";

import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";

export default function RoadmapPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-100">Roadmap</h1>
        <p className="text-sm text-zinc-400">Интерактивный холст для планирования этапов проекта.</p>
      </header>

      <RoadmapCanvas />
    </section>
  );
}
