-- AlterTable
ALTER TABLE "safety_incidents" ADD COLUMN     "aiDetected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ai_cache" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "confidence" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_moderation_results" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "overallScore" DECIMAL(3,2) NOT NULL,
    "categories" JSONB NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "autoBlocked" BOOLEAN NOT NULL DEFAULT false,
    "detectionMethod" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_moderation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethics_audits" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "fairnessScore" DECIMAL(3,2) NOT NULL,
    "giniCoefficient" DECIMAL(4,3),
    "redFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yellowFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "greenFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" JSONB NOT NULL,
    "evidenceLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ethics_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_packages" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "includesEvents" BOOLEAN NOT NULL DEFAULT false,
    "includesFiles" BOOLEAN NOT NULL DEFAULT false,
    "includesSignatures" BOOLEAN NOT NULL DEFAULT false,
    "includesAIAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "verificationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_inputHash_key" ON "ai_cache"("inputHash");

-- CreateIndex
CREATE INDEX "ai_cache_service_inputHash_idx" ON "ai_cache"("service", "inputHash");

-- CreateIndex
CREATE INDEX "ai_cache_expiresAt_idx" ON "ai_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "safety_moderation_results_entityType_entityId_idx" ON "safety_moderation_results"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "safety_moderation_results_flagged_autoBlocked_idx" ON "safety_moderation_results"("flagged", "autoBlocked");

-- CreateIndex
CREATE INDEX "ethics_audits_challengeId_createdAt_idx" ON "ethics_audits"("challengeId", "createdAt");

-- CreateIndex
CREATE INDEX "evidence_packages_challengeId_packageType_idx" ON "evidence_packages"("challengeId", "packageType");

-- AddForeignKey
ALTER TABLE "safety_moderation_results" ADD CONSTRAINT "safety_moderation_results_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "safety_incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_audits" ADD CONSTRAINT "ethics_audits_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_packages" ADD CONSTRAINT "evidence_packages_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
