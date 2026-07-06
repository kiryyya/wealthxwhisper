-- CreateTable
CREATE TABLE "KnowledgeBasePage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBasePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeBasePage_parentId_idx" ON "KnowledgeBasePage"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgeBasePage_title_idx" ON "KnowledgeBasePage"("title");

-- AddForeignKey
ALTER TABLE "KnowledgeBasePage" ADD CONSTRAINT "KnowledgeBasePage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgeBasePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
