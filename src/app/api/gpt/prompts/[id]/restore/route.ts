import { NextResponse } from "next/server";

import { restorePrompt, serializeGptChat } from "@/lib/gpt-chat";
import { isOpenAiConfigured } from "@/lib/openai";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const chat = await restorePrompt(id);

    if (!chat) {
      return NextResponse.json({ error: "Prompt version not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeGptChat(chat),
      openAiConfigured: isOpenAiConfigured(),
    });
  } catch (error) {
    console.error("POST /api/gpt/prompts/[id]/restore failed", error);
    return NextResponse.json({ error: "Failed to restore prompt" }, { status: 500 });
  }
}
