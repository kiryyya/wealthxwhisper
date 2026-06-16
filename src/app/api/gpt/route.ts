import { NextResponse } from "next/server";

import { DEFAULT_GPT_PROMPT } from "@/lib/constants";
import { DEFAULT_CHAT_ID, parseGptMessages } from "@/lib/gpt-chat";
import { prisma } from "@/lib/prisma";
import { gptPromptSchema } from "@/lib/validators";

export async function GET() {
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

    return NextResponse.json({
      id: chat.id,
      prompt: chat.prompt,
      messages: parseGptMessages(chat.messages),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/gpt failed", error);
    return NextResponse.json({ error: "Failed to fetch GPT chat" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = gptPromptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const chat = await prisma.gptChat.upsert({
      where: { id: DEFAULT_CHAT_ID },
      update: { prompt: parsed.data.prompt },
      create: {
        id: DEFAULT_CHAT_ID,
        prompt: parsed.data.prompt,
        messages: [],
      },
    });

    return NextResponse.json({
      id: chat.id,
      prompt: chat.prompt,
      messages: parseGptMessages(chat.messages),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error("PUT /api/gpt failed", error);
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const chat = await prisma.gptChat.upsert({
      where: { id: DEFAULT_CHAT_ID },
      update: { messages: [] },
      create: {
        id: DEFAULT_CHAT_ID,
        prompt: DEFAULT_GPT_PROMPT,
        messages: [],
      },
    });

    return NextResponse.json({
      id: chat.id,
      prompt: chat.prompt,
      messages: [],
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error("DELETE /api/gpt failed", error);
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
  }
}
