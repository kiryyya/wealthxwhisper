"use client";

import { Bot, Check, ChevronDown, ChevronUp, History, RotateCcw, Search, Send, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_GPT_PROMPT, GPT_SHOW_PROMPT_HISTORY_STORAGE } from "@/lib/constants";
import type { GptChatData, GptMessage, GptPromptHistoryEntry } from "@/types";

function applyChatData(
  data: GptChatData,
  setters: {
    setDraftPrompt: (value: string) => void;
    setSavedPrompt: (value: string) => void;
    setMessages: (value: GptMessage[]) => void;
    setPromptHistory: (value: GptPromptHistoryEntry[]) => void;
    setActivePromptHistoryId: (value: string | null) => void;
    setOpenAiConfigured: (value: boolean) => void;
    setPromptSavedAt: (value: Date) => void;
  },
) {
  setters.setDraftPrompt(data.prompt);
  setters.setSavedPrompt(data.prompt);
  setters.setMessages(data.messages);
  setters.setPromptHistory(data.promptHistory);
  setters.setActivePromptHistoryId(data.activePromptHistoryId);
  setters.setOpenAiConfigured(data.openAiConfigured);
  setters.setPromptSavedAt(new Date(data.updatedAt));
}

export function GptWorkspace() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draftPrompt, setDraftPrompt] = useState(DEFAULT_GPT_PROMPT);
  const [savedPrompt, setSavedPrompt] = useState(DEFAULT_GPT_PROMPT);
  const [promptHistory, setPromptHistory] = useState<GptPromptHistoryEntry[]>([]);
  const [activePromptHistoryId, setActivePromptHistoryId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const [messages, setMessages] = useState<GptMessage[]>([]);
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptSavedAt, setPromptSavedAt] = useState<Date | null>(null);

  const setters = {
    setDraftPrompt,
    setSavedPrompt,
    setMessages,
    setPromptHistory,
    setActivePromptHistoryId,
    setOpenAiConfigured,
    setPromptSavedAt,
  };

  const loadChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gpt");
      if (!response.ok) throw new Error("Не удалось загрузить чат");
      const data: GptChatData = await response.json();
      applyChatData(data, setters);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChat();
    const stored = localStorage.getItem(GPT_SHOW_PROMPT_HISTORY_STORAGE);
    if (stored === "true") setShowPromptHistory(true);
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const togglePromptHistory = () => {
    setShowPromptHistory((prev) => {
      const next = !prev;
      localStorage.setItem(GPT_SHOW_PROMPT_HISTORY_STORAGE, String(next));
      return next;
    });
  };

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return promptHistory;
    return promptHistory.filter((entry) => entry.content.toLowerCase().includes(query));
  }, [historySearch, promptHistory]);

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
      applyChatData(data, setters);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения промпта");
    } finally {
      setSavingPrompt(false);
    }
  };

  const restorePrompt = async (historyId: string) => {
    setRestoringId(historyId);
    setError(null);

    try {
      const response = await fetch(`/api/gpt/prompts/${historyId}/restore`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось откатить промпт");
      applyChatData(data, setters);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Ошибка отката");
    } finally {
      setRestoringId(null);
    }
  };

  const deletePromptVersion = async (historyId: string) => {
    setDeletingId(historyId);
    setError(null);

    try {
      const response = await fetch(`/api/gpt/prompts/${historyId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось удалить версию");
      applyChatData(data, setters);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (!openAiConfigured) {
      setError("Добавьте OPENAI_API_KEY в переменные окружения сервера");
      return;
    }

    setSending(true);
    setError(null);
    setInput("");

    try {
      const response = await fetch("/api/gpt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, prompt: draftPrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Не удалось отправить сообщение");
      }

      applyChatData(data, setters);
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
      applyChatData(data, setters);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Ошибка очистки");
    } finally {
      setClearing(false);
    }
  };

  const promptChanged = draftPrompt !== savedPrompt;
  const canDeleteHistory = promptHistory.length > 1;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {!openAiConfigured && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          Укажите переменную окружения <code className="text-amber-100">OPENAI_API_KEY</code> на сервере web.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-100">Промпт</h2>
              <p className="text-xs text-zinc-400">
                Текст из редактора передаётся в GPT при каждом сообщении.
              </p>
            </div>
            <Button variant="secondary" onClick={togglePromptHistory}>
              <History size={16} />
              {showPromptHistory ? "Скрыть историю" : "История промптов"}
              {showPromptHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>

          <label className="flex min-h-0 flex-col gap-2">
            <span className="text-xs text-zinc-400">Редактирование</span>
            <textarea
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              disabled={loading}
              className="min-h-[140px] flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
              placeholder="Опишите роль и правила для GPT..."
            />
          </label>

          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Подтверждение</span>
              {!promptChanged && <span className="text-[10px] text-emerald-400">Синхронизирован</span>}
              {promptChanged && (
                <span className="text-[10px] text-amber-400">Будет применён при отправке сообщения</span>
              )}
            </div>
            <p className="max-h-24 overflow-y-auto whitespace-pre-wrap text-sm text-zinc-300">
              {draftPrompt || "Промпт пустой"}
            </p>
            <Button onClick={confirmPrompt} disabled={loading || savingPrompt || !promptChanged} className="w-full">
              <Check size={16} />
              {savingPrompt ? "Сохранение..." : "Подтвердить и сохранить в историю"}
            </Button>
            {promptSavedAt && (
              <p className="text-[10px] text-zinc-500">Последнее сохранение: {promptSavedAt.toLocaleString()}</p>
            )}
          </div>

          {showPromptHistory && (
            <div className="flex min-h-0 flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
              <div className="flex items-center gap-2">
                <History size={14} className="text-zinc-400" />
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">История промптов</span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Поиск по тексту..."
                  className="pl-9"
                />
              </div>
              <div className="min-h-0 max-h-44 space-y-2 overflow-y-auto">
                {filteredHistory.length === 0 && (
                  <p className="text-xs text-zinc-500">История пуста или ничего не найдено.</p>
                )}
                {filteredHistory.map((entry) => {
                  const isActive = entry.id === activePromptHistoryId;
                  return (
                    <div
                      key={entry.id}
                      className={clsx(
                        "rounded-lg border px-3 py-2",
                        isActive ? "border-emerald-700/60 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900/60",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                        {isActive && <span className="text-[10px] text-emerald-400">Активный</span>}
                      </div>
                      <p className="line-clamp-3 whitespace-pre-wrap text-xs text-zinc-300">{entry.content}</p>
                      <div className="mt-2 flex gap-2">
                        {!isActive && (
                          <Button
                            variant="secondary"
                            className="flex-1"
                            disabled={restoringId === entry.id}
                            onClick={() => restorePrompt(entry.id)}
                          >
                            <RotateCcw size={14} />
                            {restoringId === entry.id ? "..." : "Откатить"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          disabled={!canDeleteHistory || deletingId === entry.id}
                          onClick={() => deletePromptVersion(entry.id)}
                          title={canDeleteHistory ? "Удалить версию" : "Нельзя удалить последнюю версию"}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-100">Чат с GPT</h2>
              <p className="text-xs text-zinc-400">GPT получает актуальный промпт из редактора при каждом сообщении.</p>
            </div>
            <Button variant="secondary" onClick={clearHistory} disabled={loading || clearing || messages.length === 0}>
              <Trash2 size={16} />
              Очистить чат
            </Button>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Активный промпт для GPT</p>
            <p className="max-h-20 overflow-y-auto whitespace-pre-wrap text-xs text-zinc-300">
              {draftPrompt || DEFAULT_GPT_PROMPT}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            {loading && <p className="text-sm text-zinc-500">Загрузка истории...</p>}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-zinc-500">Начните диалог — GPT будет следовать промпту выше.</p>
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
              disabled={loading || sending || !openAiConfigured}
            />
            <Button type="submit" disabled={loading || sending || !input.trim() || !openAiConfigured}>
              <Send size={16} />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
