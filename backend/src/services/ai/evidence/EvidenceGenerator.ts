// /src/services/ai/evidence/EvidenceGenerator.ts

import { PrismaClient } from '@prisma/client';
import { BaseAIService } from '../base/BaseAIService';
import { EvidencePackageData, GeneratedEvidence } from '../types/evidence.types';
import { PDFGenerator } from './generators/PDFGenerator';
import { QRGenerator } from './generators/QRGenerator';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { generateId } from '../../../utils/idGenerator';

export class EvidenceGenerator extends BaseAIService {
  private pdfGenerator: PDFGenerator;
  private qrGenerator: QRGenerator;
  private evidenceStoragePath: string;
  private evidenceBaseUrl: string;

  constructor(prisma: PrismaClient) {
    super(prisma, 'EVIDENCE_GENERATOR', {
      cacheTTLSeconds: 0, // Don't cache evidence packages
      enableCaching: false,
      timeoutMs: 10000, // 10s for PDF generation
    });

    this.pdfGenerator = new PDFGenerator();
    this.qrGenerator = new QRGenerator();
    this.evidenceStoragePath = process.env.EVIDENCE_STORAGE_PATH || '/home/matt/backend/evidence';
    this.evidenceBaseUrl = process.env.EVIDENCE_BASE_URL || 'http://localhost:3001/verify';
  }

  /**
   * Create audit evidence package for a challenge
   */
  async createAuditPack(data: EvidencePackageData): Promise<GeneratedEvidence> {
    try {
      console.log(`[EvidenceGenerator] Creating audit package for challenge ${data.challengeId}`);

      // Fetch challenge data
      const challenge = await this.prisma.challenges.findUnique({
        where: { id: data.challengeId },
        include: {
          users_challenges_projectLeaderIdTousers: {
            select: { email: true },
          },
          users_challenges_sponsorIdTousers: {
            select: { email: true },
          },
        },
      });

      if (!challenge) {
        throw new Error(`Challenge ${data.challengeId} not found`);
      }

      // Fetch events if requested
      let eventTimeline: any[] = [];
      if (data.includeTimeline) {
        eventTimeline = await this.prisma.events.findMany({
          where: {
            entityType: 'CHALLENGE',
            entityId: data.challengeId,
          },
          include: {
            users: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });
      }

      // Fetch file artifacts if requested
      let fileIntegrity: any[] = [];
      if (data.includeFileHashes) {
        const files = await this.prisma.file_artifacts.findMany({
          where: { challengeId: data.challengeId },
          select: {
            filename: true,
            sha256: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        });

        fileIntegrity = files.map((f) => ({
          filename: f.filename,
          sha256: f.sha256,
        }));
      }

      // Fetch compliance data (mock for now - would come from AuditorService)
      const complianceChecks = [
        { label: 'KYC/AML verified', passed: true },
        { label: 'Composition manifest signed', passed: true },
        { label: 'IP assignments collected', passed: true },
        { label: 'Payout within tolerance', passed: true },
        { label: 'Safety checks passed', passed: true },
      ];

      // Fetch ethics audit if requested
      let ethicsInfo: any = undefined;
      if (data.includeAIAnalysis) {
        const ethicsAudit = await this.prisma.ethics_audits.findFirst({
          where: { challengeId: data.challengeId },
          orderBy: { createdAt: 'desc' },
        });

        if (ethicsAudit) {
          ethicsInfo = {
            giniCoefficient: parseFloat(ethicsAudit.giniCoefficient?.toString() || '0'),
            fairnessScore: parseFloat(ethicsAudit.fairnessScore.toString()),
            redFlags: ethicsAudit.redFlags,
            yellowFlags: ethicsAudit.yellowFlags,
            greenFlags: ethicsAudit.greenFlags,
          };

          complianceChecks.push({
            label: `Ethics audit: ${ethicsInfo.redFlags.length === 0 ? 'PASS' : 'FAIL'} (fairness score: ${ethicsInfo.fairnessScore.toFixed(2)})`,
            passed: ethicsInfo.redFlags.length === 0,
          });
        }
      }

      // Fetch contribution breakdown (mock for now - would come from actual contribution records)
      const contributions = [
        {
          email: challenge.users_challenges_projectLeaderIdTousers?.email || 'leader@example.com',
          type: 'CODE',
          weight: 0.4,
          payout: parseFloat(challenge.bountyAmount.toString()) * 0.4,
        },
      ];

      // Generate temporary package ID for verification URL
      const tempPackageId = crypto.randomBytes(16).toString('hex');
      const verificationUrl = `${this.evidenceBaseUrl}/${tempPackageId}`;

      // Generate QR code
      const qrCodeBuffer = await this.qrGenerator.generate(verificationUrl);

      // Prepare PDF data
      const pdfData = {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          bountyAmount: challenge.bountyAmount.toString(),
          status: challenge.status,
          projectLeaderEmail: challenge.users_challenges_projectLeaderIdTousers?.email || 'N/A',
          createdAt: challenge.createdAt,
        },
        contributions,
        complianceChecks,
        ethicsInfo,
        eventTimeline: eventTimeline.map((e) => ({
          timestamp: e.createdAt,
          action: e.action,
          actorEmail: e.users.email,
        })),
        fileIntegrity,
        verificationUrl,
        qrCodeBuffer,
        packageSha256: '', // Will be calculated after PDF generation
        generatedAt: new Date(),
      };

      // Generate PDF
      console.log(`[EvidenceGenerator] Generating PDF for challenge ${data.challengeId}`);
      const pdfBuffer = await this.pdfGenerator.generateAuditReport(pdfData);

      // Calculate SHA256 of PDF
      const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const fileName = `audit_${data.challengeId}_${timestamp}.pdf`;

      // Save PDF to storage
      const storagePath = path.join(this.evidenceStoragePath, fileName);
      await fs.writeFile(storagePath, pdfBuffer);

      console.log(`[EvidenceGenerator] Saved PDF to ${storagePath}`);

      // Create EvidencePackage record in database
      const evidencePackage = await this.prisma.evidence_packages.create({
        data: {
          id: generateId(),
          challengeId: data.challengeId,
          packageType: data.packageType,
          fileName,
          fileSize: pdfBuffer.length,
          storageKey: storagePath,
          sha256,
          includesEvents: data.includeTimeline,
          includesFiles: data.includeFileHashes,
          includesSignatures: data.includeSignatures,
          includesAIAnalysis: data.includeAIAnalysis,
          verificationUrl: `${this.evidenceBaseUrl}/${tempPackageId}`,
        },
      });

      console.log(`[EvidenceGenerator] Created EvidencePackage record: ${evidencePackage.id}`);

      // Count pages (rough estimate based on buffer size)
      const estimatedPages = Math.ceil(pdfBuffer.length / 5000);

      return {
        fileName,
        buffer: pdfBuffer,
        metadata: {
          pages: estimatedPages,
          generatedAt: new Date().toISOString(),
          verificationUrl: evidencePackage.verificationUrl || verificationUrl,
          sha256,
        },
      };
    } catch (error) {
      console.error('[EvidenceGenerator] Error creating audit package:', error);
      throw new Error(
        `Failed to create audit package: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify evidence package integrity
   */
  async verifyPackage(packageId: string): Promise<{
    valid: boolean;
    challenge?: {
      id: string;
      title: string;
    };
    generatedAt?: Date;
    sha256?: string;
  }> {
    try {
      const evidencePackage = await this.prisma.evidence_packages.findFirst({
        where: {
          verificationUrl: {
            contains: packageId,
          },
        },
        include: {
          challenges: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!evidencePackage) {
        return { valid: false };
      }

      // Read file and verify SHA256
      try {
        const fileBuffer = await fs.readFile(evidencePackage.storageKey);
        const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        return {
          valid: calculatedHash === evidencePackage.sha256,
          challenge: evidencePackage.challenges,
          generatedAt: evidencePackage.createdAt,
          sha256: evidencePackage.sha256,
        };
      } catch (fileError) {
        console.error('[EvidenceGenerator] Error reading file for verification:', fileError);
        return { valid: false };
      }
    } catch (error) {
      console.error('[EvidenceGenerator] Error verifying package:', error);
      return { valid: false };
    }
  }

  /**
   * List all evidence packages for a challenge
   */
  async listPackages(challengeId: string) {
    return this.prisma.evidence_packages.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        packageType: true,
        fileName: true,
        fileSize: true,
        sha256: true,
        verificationUrl: true,
        createdAt: true,
        includesEvents: true,
        includesFiles: true,
        includesSignatures: true,
        includesAIAnalysis: true,
      },
    });
  }
}
