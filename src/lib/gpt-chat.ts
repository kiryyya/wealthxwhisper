import { Prisma } from "@prisma/client";

import { DEFAULT_GPT_PROMPT } from "@/lib/constants";
import type { GptMessage } from "@/types";

const DEFAULT_CHAT_ID = "main";

export function parseGptMessages(value: Prisma.JsonValue): GptMessage[] {
  if (!Array.isArray(value)) return [];
  return value as GptMessage[];
}

export function getDefaultGptChatPayload() {
  return {
    id: DEFAULT_CHAT_ID,
    prompt: DEFAULT_GPT_PROMPT,
    messages: [] as GptMessage[],
  };
}

export { DEFAULT_CHAT_ID };
