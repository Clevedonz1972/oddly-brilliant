-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "projectLeaderId" TEXT,
ADD COLUMN     "scopeSignedOff" TIMESTAMP(3),
ADD COLUMN     "scopingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vettedAt" TIMESTAMP(3),
ADD COLUMN     "vettedBy" TEXT,
ADD COLUMN     "vettingNotes" TEXT,
ADD COLUMN     "vettingStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "kycVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "contentHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_artifacts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "challengeId" TEXT,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "ipfsCid" TEXT,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "composition_manifests" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "entries" JSONB NOT NULL,
    "totalDeclared" DECIMAL(4,3) NOT NULL,
    "signedByLeader" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "composition_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT,
    "raisedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceEventIds" TEXT[],
    "assignedTo" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asContributor" INTEGER NOT NULL DEFAULT 0,
    "asProjectLeader" INTEGER NOT NULL DEFAULT 0,
    "asSponsor" INTEGER NOT NULL DEFAULT 0,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "successfulProj" INTEGER NOT NULL DEFAULT 0,
    "disputesRaised" INTEGER NOT NULL DEFAULT 0,
    "disputesAgainst" INTEGER NOT NULL DEFAULT 0,
    "contributionPoints" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "leadershipPoints" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stewardshipPoints" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_proposals" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "distribution" JSONB NOT NULL,
    "withinTolerance" BOOLEAN NOT NULL DEFAULT true,
    "toleranceNote" TEXT,
    "signedByLeader" BOOLEAN NOT NULL DEFAULT false,
    "leaderSignedAt" TIMESTAMP(3),
    "sponsorApproved" BOOLEAN NOT NULL DEFAULT false,
    "sponsorApprovedAt" TIMESTAMP(3),
    "auditStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "auditNotes" TEXT,
    "evidencePackUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ir35_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT,
    "responses" JSONB NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "assessedBy" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "ir35_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_entityType_entityId_createdAt_idx" ON "events"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "events_actorId_createdAt_idx" ON "events"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "file_artifacts_sha256_key" ON "file_artifacts"("sha256");

-- CreateIndex
CREATE INDEX "file_artifacts_challengeId_createdAt_idx" ON "file_artifacts"("challengeId", "createdAt");

-- CreateIndex
CREATE INDEX "file_artifacts_sha256_idx" ON "file_artifacts"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "composition_manifests_challengeId_key" ON "composition_manifests"("challengeId");

-- CreateIndex
CREATE INDEX "composition_manifests_challengeId_signedByLeader_idx" ON "composition_manifests"("challengeId", "signedByLeader");

-- CreateIndex
CREATE INDEX "safety_incidents_status_severity_idx" ON "safety_incidents"("status", "severity");

-- CreateIndex
CREATE INDEX "safety_incidents_challengeId_idx" ON "safety_incidents"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "reputations_userId_key" ON "reputations"("userId");

-- CreateIndex
CREATE INDEX "payout_proposals_challengeId_idx" ON "payout_proposals"("challengeId");

-- CreateIndex
CREATE INDEX "payout_proposals_auditStatus_idx" ON "payout_proposals"("auditStatus");

-- CreateIndex
CREATE INDEX "ir35_assessments_userId_assessedAt_idx" ON "ir35_assessments"("userId", "assessedAt");

-- CreateIndex
CREATE INDEX "ir35_assessments_riskLevel_idx" ON "ir35_assessments"("riskLevel");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_vettedBy_fkey" FOREIGN KEY ("vettedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_projectLeaderId_fkey" FOREIGN KEY ("projectLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_artifacts" ADD CONSTRAINT "file_artifacts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_artifacts" ADD CONSTRAINT "file_artifacts_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_manifests" ADD CONSTRAINT "composition_manifests_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_manifests" ADD CONSTRAINT "composition_manifests_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputations" ADD CONSTRAINT "reputations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_proposals" ADD CONSTRAINT "payout_proposals_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_proposals" ADD CONSTRAINT "payout_proposals_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir35_assessments" ADD CONSTRAINT "ir35_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ir35_assessments" ADD CONSTRAINT "ir35_assessments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
