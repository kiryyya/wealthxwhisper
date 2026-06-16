import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { buildSystemPrompt, DEFAULT_CHAT_ID, ensureGptChat, parseGptMessages, savePrompt, serializeGptChat } from "@/lib/gpt-chat";
import { getOpenAiApiKey, isOpenAiConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { gptChatInputSchema } from "@/lib/validators";
import type { GptMessage } from "@/types";

type OpenAiResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

export async function POST(req: Request) {
  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const parsed = gptChatInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    let chat = await ensureGptChat();

    if (parsed.data.prompt !== undefined && parsed.data.prompt !== chat.prompt) {
      chat = await savePrompt(parsed.data.prompt);
    }

    const history = parseGptMessages(chat.messages);
    const userMessage: GptMessage = {
      id: randomUUID(),
      role: "user",
      content: parsed.data.message,
      createdAt: new Date().toISOString(),
    };

    const openAiMessages = [
      { role: "system" as const, content: buildSystemPrompt(chat.prompt) },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user" as const, content: userMessage.content },
    ];

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAiApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAiMessages,
        temperature: 0.7,
      }),
    });

    const openAiData = (await openAiResponse.json()) as OpenAiResponse;

    if (!openAiResponse.ok) {
      return NextResponse.json(
        { error: openAiData.error?.message || "OpenAI request failed" },
        { status: openAiResponse.status },
      );
    }

    const assistantText = openAiData.choices?.[0]?.message?.content?.trim();
    if (!assistantText) {
      return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 502 });
    }

    const assistantMessage: GptMessage = {
      id: randomUUID(),
      role: "assistant",
      content: assistantText,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...history, userMessage, assistantMessage];

    const updated = await prisma.gptChat.update({
      where: { id: DEFAULT_CHAT_ID },
      data: { messages: nextMessages },
      include: { promptHistory: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json({
      ...serializeGptChat(updated),
      openAiConfigured: isOpenAiConfigured(),
    });
  } catch (error) {
    console.error("POST /api/gpt/chat failed", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
