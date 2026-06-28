-- CreateTable
CREATE TABLE "EventCategorySection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCategorySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCategorySectionTodo" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCategorySectionTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventCategorySection_categoryId_idx" ON "EventCategorySection"("categoryId");

-- CreateIndex
CREATE INDEX "EventCategorySectionTodo_sectionId_idx" ON "EventCategorySectionTodo"("sectionId");

-- AddForeignKey
ALTER TABLE "EventCategorySection" ADD CONSTRAINT "EventCategorySection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategorySectionTodo" ADD CONSTRAINT "EventCategorySectionTodo_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "EventCategorySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
