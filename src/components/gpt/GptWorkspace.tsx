"use client";

import { Bot, Check, KeyRound, Send, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_GPT_PROMPT, OPENAI_API_KEY_STORAGE } from "@/lib/constants";
import type { GptChatData, GptMessage } from "@/types";

export function GptWorkspace() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draftPrompt, setDraftPrompt] = useState(DEFAULT_GPT_PROMPT);
  const [savedPrompt, setSavedPrompt] = useState(DEFAULT_GPT_PROMPT);
  const [messages, setMessages] = useState<GptMessage[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptSavedAt, setPromptSavedAt] = useState<Date | null>(null);

  const loadChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gpt");
      if (!response.ok) throw new Error("Не удалось загрузить чат");
      const data: GptChatData = await response.json();
      setDraftPrompt(data.prompt);
      setSavedPrompt(data.prompt);
      setMessages(data.messages);
      setPromptSavedAt(new Date(data.updatedAt));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChat();
    const storedKey = localStorage.getItem(OPENAI_API_KEY_STORAGE);
    if (storedKey) setApiKey(storedKey);
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const saveApiKey = () => {
    localStorage.setItem(OPENAI_API_KEY_STORAGE, apiKey.trim());
  };

  const confirmPrompt = async () => {
    setSavingPrompt(true);
    setError(null);

    try {
      const response = await fetch("/api/gpt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: draftPrompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Не удалось сохранить промпт");

      setSavedPrompt(data.prompt);
      setDraftPrompt(data.prompt);
      setPromptSavedAt(new Date(data.updatedAt));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения промпта");
    } finally {
      setSavingPrompt(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (!apiKey.trim()) {
      setError("Укажите OpenAI API key");
      return;
    }

    setSending(true);
    setError(null);
    setInput("");

    try {
      const response = await fetch("/api/gpt/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": apiKey.trim(),
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Не удалось отправить сообщение");
      }

      setMessages(data.messages);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Ошибка отправки");
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    setClearing(true);
    setError(null);

    try {
      const response = await fetch("/api/gpt", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error("Не удалось очистить историю");
      setMessages(data.messages);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Ошибка очистки");
    } finally {
      setClearing(false);
    }
  };

  const promptChanged = draftPrompt !== savedPrompt;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-100">Промпт</h2>
            <p className="text-xs text-zinc-400">
              Системный промпт всегда передаётся в GPT вместе с историей чата.
            </p>
          </div>

          <label className="flex min-h-0 flex-1 flex-col gap-2">
            <span className="text-xs text-zinc-400">Редактирование</span>
            <textarea
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              disabled={loading}
              className="min-h-[180px] flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
              placeholder="Опишите роль и правила для GPT..."
            />
          </label>

          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Подтверждение
              </span>
              {promptSavedAt && !promptChanged && (
                <span className="text-[10px] text-emerald-400">Активен</span>
              )}
              {promptChanged && (
                <span className="text-[10px] text-amber-400">Есть несохранённые изменения</span>
              )}
            </div>
            <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-sm text-zinc-300">
              {draftPrompt || "Промпт пустой"}
            </p>
            <Button onClick={confirmPrompt} disabled={loading || savingPrompt || !promptChanged} className="w-full">
              <Check size={16} />
              {savingPrompt ? "Сохранение..." : "Подтвердить и сохранить промпт"}
            </Button>
            {promptSavedAt && (
              <p className="text-[10px] text-zinc-500">
                Активный промпт сохранён: {promptSavedAt.toLocaleString()}
              </p>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-100">Чат с GPT</h2>
              <p className="text-xs text-zinc-400">История хранится в базе и сохраняет контекст диалога.</p>
            </div>
            <Button variant="secondary" onClick={clearHistory} disabled={loading || clearing || messages.length === 0}>
              <Trash2 size={16} />
              Очистить
            </Button>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <KeyRound size={14} />
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
              <Button variant="secondary" onClick={saveApiKey} disabled={!apiKey.trim()}>
                Сохранить
              </Button>
            </div>
            <p className="text-[10px] text-zinc-500">Ключ хранится только в браузере, не отправляется в БД.</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            {loading && <p className="text-sm text-zinc-500">Загрузка истории...</p>}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-zinc-500">Начните диалог — GPT будет следовать активному промпту.</p>
            )}

            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    "flex gap-2 rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "ml-8 bg-zinc-800 text-zinc-100"
                      : "mr-8 bg-zinc-900 text-zinc-200",
                  )}
                >
                  <span className="mt-0.5 shrink-0 text-zinc-400">
                    {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </span>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              {sending && (
                <div className="mr-8 flex gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-400">
                  <Bot size={14} className="mt-0.5" />
                  <span>GPT печатает...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Напишите сообщение..."
              disabled={loading || sending}
            />
            <Button type="submit" disabled={loading || sending || !input.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
