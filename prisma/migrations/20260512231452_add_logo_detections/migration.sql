-- CreateTable
CREATE TABLE "LogoDetection" (
    "id" TEXT NOT NULL,
    "sourceImageId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceImagePath" TEXT,
    "previewImagePath" TEXT,
    "previewUrl" TEXT,
    "detected" BOOLEAN NOT NULL DEFAULT true,
    "detectionId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "logoConfidence" DOUBLE PRECISION NOT NULL,
    "bbox" JSONB NOT NULL,
    "bboxPadded" JSONB NOT NULL,
    "cropPath" TEXT,
    "cropUrl" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "analysisId" TEXT,
    "crawlerResultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogoDetection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogoDetection_analysisId_idx" ON "LogoDetection"("analysisId");

-- CreateIndex
CREATE INDEX "LogoDetection_crawlerResultId_idx" ON "LogoDetection"("crawlerResultId");

-- CreateIndex
CREATE INDEX "LogoDetection_sourceImageId_idx" ON "LogoDetection"("sourceImageId");

-- CreateIndex
CREATE INDEX "LogoDetection_sourceType_idx" ON "LogoDetection"("sourceType");

-- CreateIndex
CREATE INDEX "LogoDetection_brand_idx" ON "LogoDetection"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "LogoDetection_sourceImageId_detectionId_key" ON "LogoDetection"("sourceImageId", "detectionId");

-- AddForeignKey
ALTER TABLE "LogoDetection" ADD CONSTRAINT "LogoDetection_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoDetection" ADD CONSTRAINT "LogoDetection_crawlerResultId_fkey" FOREIGN KEY ("crawlerResultId") REFERENCES "CrawlerResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
