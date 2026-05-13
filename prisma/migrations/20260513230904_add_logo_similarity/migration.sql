-- CreateTable
CREATE TABLE "LogoSimilarity" (
    "id" TEXT NOT NULL,
    "logoDetectionId" TEXT NOT NULL,
    "sourceImageId" TEXT NOT NULL,
    "detectionId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "rawStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "decision" TEXT,
    "isFake" BOOLEAN,
    "similarityScore" DOUBLE PRECISION,
    "clipScore" DOUBLE PRECISION,
    "shapeScore" DOUBLE PRECISION,
    "shapeDetails" JSONB,
    "topReferenceCandidates" JSONB,
    "confidence" DOUBLE PRECISION,
    "thresholdUsed" DOUBLE PRECISION,
    "thresholds" JSONB,
    "matchedReferenceId" TEXT,
    "matchedReferencePath" TEXT,
    "matchedReference" TEXT,
    "logoConfidence" DOUBLE PRECISION,
    "notes" TEXT,
    "modelVersion" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogoSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogoSimilarity_logoDetectionId_key" ON "LogoSimilarity"("logoDetectionId");

-- CreateIndex
CREATE INDEX "LogoSimilarity_sourceImageId_idx" ON "LogoSimilarity"("sourceImageId");

-- CreateIndex
CREATE INDEX "LogoSimilarity_detectionId_idx" ON "LogoSimilarity"("detectionId");

-- CreateIndex
CREATE INDEX "LogoSimilarity_brand_idx" ON "LogoSimilarity"("brand");

-- CreateIndex
CREATE INDEX "LogoSimilarity_status_idx" ON "LogoSimilarity"("status");

-- AddForeignKey
ALTER TABLE "LogoSimilarity" ADD CONSTRAINT "LogoSimilarity_logoDetectionId_fkey" FOREIGN KEY ("logoDetectionId") REFERENCES "LogoDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
