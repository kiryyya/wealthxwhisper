import { NextResponse } from "next/server";

import { deletePromptHistory, serializeGptChat } from "@/lib/gpt-chat";
import { isOpenAiConfigured } from "@/lib/openai";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    const chat = await deletePromptHistory(id);

    if (!chat) {
      return NextResponse.json({ error: "Prompt version not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeGptChat(chat),
      openAiConfigured: isOpenAiConfigured(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete prompt version";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
