"use client";

import { GptWorkspace } from "@/components/gpt/GptWorkspace";

export default function GptPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-100">GPT Ассистент</h1>
        <p className="text-sm text-zinc-400">
          Настройте системный промпт и ведите диалог с сохранением контекста.
        </p>
      </header>

      <GptWorkspace />
    </section>
  );
}
