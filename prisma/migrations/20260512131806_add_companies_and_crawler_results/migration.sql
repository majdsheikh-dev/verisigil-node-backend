-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" INTEGER;

-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "brandSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlerResult" (
    "id" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "platform" TEXT,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "localImagePath" TEXT,
    "sellerName" TEXT,
    "sellerProfileUrl" TEXT,
    "productStatus" TEXT NOT NULL DEFAULT 'pending_analysis',
    "productStatusLabel" TEXT NOT NULL DEFAULT 'Pending Analysis',
    "productConfidence" DOUBLE PRECISION,
    "brandName" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "croppedLogoPath" TEXT,
    "aiNotes" JSONB,
    "accountLabel" TEXT,
    "fakeProbability" DOUBLE PRECISION,
    "realProbability" DOUBLE PRECISION,
    "accountScorePercent" DOUBLE PRECISION,
    "targetSite" TEXT,
    "searchQuery" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlerResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_brandSlug_key" ON "Company"("brandSlug");

-- CreateIndex
CREATE INDEX "CrawlerResult_companyId_idx" ON "CrawlerResult"("companyId");

-- CreateIndex
CREATE INDEX "CrawlerResult_brand_idx" ON "CrawlerResult"("brand");

-- CreateIndex
CREATE INDEX "CrawlerResult_sourceType_idx" ON "CrawlerResult"("sourceType");

-- CreateIndex
CREATE INDEX "CrawlerResult_productStatus_idx" ON "CrawlerResult"("productStatus");

-- CreateIndex
CREATE INDEX "CrawlerResult_accountLabel_idx" ON "CrawlerResult"("accountLabel");

-- CreateIndex
CREATE INDEX "CrawlerResult_capturedAt_idx" ON "CrawlerResult"("capturedAt");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlerResult" ADD CONSTRAINT "CrawlerResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
