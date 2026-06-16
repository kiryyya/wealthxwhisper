-- AlterTable
ALTER TABLE "GptChat" ADD COLUMN     "activePromptHistoryId" TEXT;

-- CreateTable
CREATE TABLE "GptPromptHistory" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL DEFAULT 'main',

    CONSTRAINT "GptPromptHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GptPromptHistory_chatId_createdAt_idx" ON "GptPromptHistory"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "GptPromptHistory" ADD CONSTRAINT "GptPromptHistory_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "GptChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
