import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { DEFAULT_GPT_PROMPT } from "@/lib/constants";
import { DEFAULT_CHAT_ID, parseGptMessages } from "@/lib/gpt-chat";
import { prisma } from "@/lib/prisma";
import { gptChatInputSchema } from "@/lib/validators";
import type { GptMessage } from "@/types";

type OpenAiResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-openai-api-key")?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = gptChatInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const chat = await prisma.gptChat.upsert({
      where: { id: DEFAULT_CHAT_ID },
      update: {},
      create: {
        id: DEFAULT_CHAT_ID,
        prompt: DEFAULT_GPT_PROMPT,
        messages: [],
      },
    });

    const history = parseGptMessages(chat.messages);
    const userMessage: GptMessage = {
      id: randomUUID(),
      role: "user",
      content: parsed.data.message,
      createdAt: new Date().toISOString(),
    };

    const openAiMessages = [
      { role: "system" as const, content: chat.prompt || DEFAULT_GPT_PROMPT },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user" as const, content: userMessage.content },
    ];

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    });

    return NextResponse.json({
      id: updated.id,
      prompt: updated.prompt,
      messages: parseGptMessages(updated.messages),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/gpt/chat failed", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
