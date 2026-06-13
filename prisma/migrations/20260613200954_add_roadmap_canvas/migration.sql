-- CreateTable
CREATE TABLE "RoadmapCanvas" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "items" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapCanvas_pkey" PRIMARY KEY ("id")
);
