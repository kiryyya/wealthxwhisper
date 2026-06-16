import { NextResponse } from "next/server";

import { ensureGptChat, savePrompt, serializeGptChat, DEFAULT_CHAT_ID } from "@/lib/gpt-chat";
import { isOpenAiConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { gptPromptSchema } from "@/lib/validators";

export async function GET() {
  try {
    const chat = await ensureGptChat();

    return NextResponse.json({
      ...serializeGptChat(chat),
      openAiConfigured: isOpenAiConfigured(),
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
    const chat = await savePrompt(parsed.data.prompt);

    return NextResponse.json({
      ...serializeGptChat(chat),
      openAiConfigured: isOpenAiConfigured(),
    });
  } catch (error) {
    console.error("PUT /api/gpt failed", error);
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureGptChat();
    const chat = await prisma.gptChat.update({
      where: { id: DEFAULT_CHAT_ID },
      data: { messages: [] },
      include: { promptHistory: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json({
      ...serializeGptChat(chat),
      openAiConfigured: isOpenAiConfigured(),
    });
  } catch (error) {
    console.error("DELETE /api/gpt failed", error);
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
  }
}
