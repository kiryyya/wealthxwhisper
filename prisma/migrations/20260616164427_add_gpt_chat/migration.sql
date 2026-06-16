-- CreateTable
CREATE TABLE "GptChat" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "prompt" TEXT NOT NULL DEFAULT '',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GptChat_pkey" PRIMARY KEY ("id")
);
