export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}
