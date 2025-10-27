# Phase 4.2: AI Services Architecture

**Project**: Oddly Brilliant - Neurodivergent Collaboration Platform
**Phase**: 4.2 - AI/ML Integration for Governance & Compliance
**Status**: Design Phase
**Created**: 2025-10-25

---

## Executive Summary

This document outlines a **budget-conscious, privacy-first** AI architecture for enhancing the Oddly Brilliant governance system. The design prioritizes **local-first solutions** with minimal third-party dependencies, focusing on simple, reliable, and auditable AI services.

**Key Principles**:
- Privacy-first: No sensitive data sent to external APIs
- Cost-effective: Prefer free/open-source solutions
- Simple & reliable: Avoid complex ML pipelines
- Production-ready: Focus on accuracy and auditability
- Fast response times: <2s for critical operations

---

## 1. Technology Recommendations

### 1.1 Content Moderation (SafetyService)

**Recommended Approach**: Hybrid Local + Lightweight API

| Option | Pros | Cons | Cost | Decision |
|--------|------|------|------|----------|
| **Local Sentiment Analysis** (compromise-nlp) | Free, fast, private | Limited accuracy | $0/mo | ✅ PRIMARY |
| **Local Profanity Filter** (bad-words) | Free, instant, no ML needed | Rule-based only | $0/mo | ✅ PRIMARY |
| **OpenAI Moderation API** | High accuracy, free tier | Privacy concerns | $0-20/mo | ✅ FALLBACK |
| **Perspective API** (Google) | Free, specialized | Quota limits, latency | $0/mo | ❌ No |

**Final Stack**:
- **compromise-nlp**: Local sentiment analysis (detect negative tone)
- **bad-words**: Local profanity/hate speech detection
- **OpenAI Moderation API**: Fallback for ambiguous cases (hash content before sending)
- **Custom keyword lists**: Harassment patterns, self-harm indicators

### 1.2 Audit Intelligence (AuditorAI)

**Recommended Approach**: Pure Local Analytics (No AI needed)

| Feature | Implementation | Reasoning |
|---------|----------------|-----------|
| **Fairness Analysis** | Statistical thresholds (Gini coefficient, variance) | ML overkill for math |
| **Anomaly Detection** | Standard deviation + outliers | Simple, interpretable |
| **Pattern Recognition** | Rule-based heuristics | Transparent, auditable |
| **Report Generation** | Templates + data aggregation | No AI required |

**No AI Library Needed**: Use pure TypeScript/PostgreSQL analytics.

### 1.3 Ethics Checking (EthicsService)

**Recommended Approach**: Rule-Based + Statistical Analysis

| Check | Implementation | Tool |
|-------|----------------|------|
| **Attribution Fairness** | Compare contribution % vs payout % | Pure math |
| **Bias Detection** | Distribution analysis (std dev, quartiles) | PostgreSQL + TypeScript |
| **Exploitation Patterns** | Red flags (1 person >70%, unpaid contributors) | Heuristics |
| **Neurodiversity Support** | Check for accessibility accommodations | Custom validation |

**No AI Library Needed**: Rules + math are more transparent than black-box ML.

### 1.4 Evidence Generation (EvidenceGenerator)

**Recommended Approach**: PDF Generation + Template Engine

| Option | Pros | Cons | Cost | Decision |
|--------|------|------|------|----------|
| **PDFKit** | Full control, Node.js native | Manual layout | $0 | ✅ YES |
| **Puppeteer** | HTML → PDF, easy styling | Heavy (~300MB) | $0 | ❌ No |
| **pdfmake** | Declarative, lightweight | Limited styling | $0 | ✅ BACKUP |
| **jsPDF** | Simple, widely used | Client-side focused | $0 | ❌ No |

**Final Stack**:
- **PDFKit**: Primary PDF generation
- **Handlebars**: Template engine for reports
- **QR Code**: Embed verification links
- **Chart.js (node-canvas)**: Generate compliance graphs

---

## 2. Service Architecture

### 2.1 System Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Express)                     │
└───────────────────┬──────────────────┬──────────────────────┘
                    │                  │
        ┌───────────▼─────────┐   ┌───▼──────────────┐
        │   SafetyController   │   │ AuditorController│
        └───────────┬─────────┘   └───┬──────────────┘
                    │                  │
┌───────────────────▼──────────────────▼───────────────────────┐
│                   AI Service Layer                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │SafetyService │  │ AuditorAI    │  │EthicsService │      │
│  │              │  │              │  │              │      │
│  │ - Local NLP  │  │ - Statistics │  │ - Rule-based │      │
│  │ - Profanity  │  │ - Analytics  │  │ - Thresholds │      │
│  │ - API fallbk │  │ - No AI      │  │ - No AI      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └────────┬─────────┴──────────────────┘              │
│                  │                                           │
│         ┌────────▼───────────┐                               │
│         │ EvidenceGenerator  │                               │
│         │                    │                               │
│         │ - PDF generation   │                               │
│         │ - Template engine  │                               │
│         │ - Audit packages   │                               │
│         └────────┬───────────┘                               │
└──────────────────┼───────────────────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   Data Layer       │
         │                    │
         │  - Events          │
         │  - FileArtifacts   │
         │  - Incidents       │
         │  - Proposals       │
         │  - AICache         │ ← New table
         └────────────────────┘
```

### 2.2 Service Interactions

```typescript
// Example flow: Contribution submission
1. User submits contribution
2. SafetyService.analyzeContent(text) → Safety score
3. If flagged → Create SafetyIncident
4. EventService.emit({action: 'CONTRIBUTION_FLAGGED'})
5. Return to user with warning/block

// Example flow: Payout validation
1. Project leader submits payout proposal
2. EthicsService.checkFairness(proposal) → Ethics report
3. AuditorAI.validatePayout(challengeId) → Compliance check
4. EvidenceGenerator.createAuditPack(challengeId) → PDF
5. Store evidencePackUrl in PayoutProposal
```

---

## 3. Database Schema Changes

### 3.1 New Tables

```prisma
// ============================================================================
// AI SERVICE MODELS - Phase 4.2
// ============================================================================

// AI response caching - avoid redundant API calls
model AICache {
  id          String   @id @default(cuid())
  service     String   // "SAFETY" | "MODERATION" | "ETHICS"
  inputHash   String   @unique  // SHA256 of input (for privacy)
  response    Json     // Cached result
  confidence  Decimal? @db.Decimal(3,2)  // 0.00 - 1.00
  createdAt   DateTime @default(now())
  expiresAt   DateTime // Cache TTL (e.g., 30 days)

  @@index([service, inputHash])
  @@index([expiresAt])  // For cleanup jobs
  @@map("ai_cache")
}

// Safety moderation results
model SafetyModerationResult {
  id              String   @id @default(cuid())
  entityType      String   // "CONTRIBUTION" | "CHALLENGE" | "COMMENT"
  entityId        String

  // Analysis results
  overallScore    Decimal  @db.Decimal(3,2)  // 0.00 = safe, 1.00 = harmful
  categories      Json     // {harassment: 0.1, hate: 0.05, selfHarm: 0.0, ...}
  flagged         Boolean  @default(false)
  autoBlocked     Boolean  @default(false)

  // Detection metadata
  detectionMethod String   // "LOCAL" | "API" | "MANUAL"
  confidence      Decimal  @db.Decimal(3,2)

  // Linked incident (if flagged)
  incidentId      String?
  incident        SafetyIncident? @relation(fields: [incidentId], references: [id])

  createdAt       DateTime @default(now())

  @@index([entityType, entityId])
  @@index([flagged, autoBlocked])
  @@map("safety_moderation_results")
}

// Ethics audit trail
model EthicsAudit {
  id              String   @id @default(cuid())
  challengeId     String
  challenge       Challenge @relation(fields: [challengeId], references: [id])

  // Analysis results
  fairnessScore   Decimal  @db.Decimal(3,2)  // 0.00 = unfair, 1.00 = fair
  giniCoefficient Decimal? @db.Decimal(4,3)  // Inequality measure (0-1)

  // Red flags detected
  redFlags        String[] @default([])  // ["SINGLE_CONTRIBUTOR_DOMINANCE", "UNPAID_WORK", ...]
  yellowFlags     String[] @default([])
  greenFlags      String[] @default([])

  // Recommendations
  recommendations Json     // [{type, description, priority}]

  // Evidence
  evidenceLinks   String[] @default([])  // Event IDs, file hashes

  createdAt       DateTime @default(now())

  @@index([challengeId, createdAt])
  @@map("ethics_audits")
}

// AI-generated evidence packages
model EvidencePackage {
  id              String   @id @default(cuid())
  challengeId     String
  challenge       Challenge @relation(fields: [challengeId], references: [id])

  // Package metadata
  packageType     String   // "PAYOUT_AUDIT" | "COMPLIANCE_REPORT" | "INCIDENT_EVIDENCE"
  fileName        String
  fileSize        Int
  storageKey      String   // S3/local path
  sha256          String   // Integrity hash

  // Content summary
  includesEvents  Boolean  @default(false)
  includesFiles   Boolean  @default(false)
  includesSignatures Boolean @default(false)
  includesAIAnalysis Boolean @default(false)

  // Verification
  verificationUrl String?  // Public URL with QR code

  createdAt       DateTime @default(now())

  @@index([challengeId, packageType])
  @@map("evidence_packages")
}
```

### 3.2 Schema Updates to Existing Models

```prisma
// Add to SafetyIncident model
model SafetyIncident {
  // ... existing fields ...

  // NEW: Link to AI moderation
  moderationResults SafetyModerationResult[]

  // NEW: AI-detected flag
  aiDetected        Boolean  @default(false)
}

// Add to Challenge model
model Challenge {
  // ... existing fields ...

  // NEW: Link to ethics audits
  ethicsAudits    EthicsAudit[]
  evidencePackages EvidencePackage[]
}
```

---

## 4. Implementation Order

### Priority 1: SafetyService (Week 1-2)
**Reason**: Critical for platform trust, immediate user impact

**Implementation Steps**:
1. Install dependencies: `compromise`, `bad-words`, `openai`
2. Create `/src/services/ai/SafetyService.ts`
3. Implement local content analysis (profanity, sentiment)
4. Add OpenAI fallback for ambiguous cases
5. Create database schema for `SafetyModerationResult`
6. Add caching layer (`AICache`)
7. Write comprehensive tests (95%+ coverage)
8. Add API endpoint: `POST /api/admin/safety/analyze`

**Success Criteria**:
- Analyze content in <500ms (local)
- 95%+ accuracy on test dataset
- Auto-block severity 5 content
- Create incidents for severity 3-4

---

### Priority 2: EvidenceGenerator (Week 3)
**Reason**: Needed for payout compliance, high legal value

**Implementation Steps**:
1. Install dependencies: `pdfkit`, `handlebars`, `qrcode`, `chart.js`
2. Create `/src/services/ai/EvidenceGenerator.ts`
3. Design PDF templates (audit report, compliance cert)
4. Implement event timeline visualization
5. Add file hash verification section
6. Generate QR codes for verification URLs
7. Create database schema for `EvidencePackage`
8. Add API endpoint: `POST /api/admin/auditor/generate-evidence/:challengeId`

**Success Criteria**:
- Generate PDF in <5s
- Include all audit trail elements
- Tamper-evident with hashes
- Beautiful, professional design

---

### Priority 3: EthicsService (Week 4)
**Reason**: Core governance feature, but pure logic (no AI complexity)

**Implementation Steps**:
1. Create `/src/services/ai/EthicsService.ts`
2. Implement Gini coefficient calculation
3. Add red flag detection heuristics
4. Create fairness scoring algorithm
5. Generate recommendations engine
6. Create database schema for `EthicsAudit`
7. Add API endpoint: `POST /api/admin/ethics/audit/:challengeId`
8. Integrate with payout proposal flow

**Success Criteria**:
- Detect 10+ ethics red flags
- Provide actionable recommendations
- No false positives on test cases
- Clear audit trail

---

### Priority 4: AuditorAI Enhancement (Week 5)
**Reason**: Extends existing AuditorService, incremental value

**Implementation Steps**:
1. Enhance existing `/src/services/auditor/AuditorService.ts`
2. Add statistical anomaly detection
3. Implement trend analysis (compare to platform averages)
4. Create automated compliance reports
5. Add machine-readable audit logs (JSON)
6. Integrate SafetyService + EthicsService checks
7. Update API endpoints with AI insights

**Success Criteria**:
- Detect 95%+ of known anomalies
- Generate reports in <3s
- No breaking changes to existing API
- Backwards compatible

---

## 5. Code Structure

### 5.1 Directory Layout

```
/src/services/ai/
├── README.md                          # AI services overview
├── base/
│   ├── BaseAIService.ts              # Abstract base class
│   └── AIServiceConfig.ts            # Shared configuration
├── safety/
│   ├── SafetyService.ts              # Main service
│   ├── analyzers/
│   │   ├── LocalAnalyzer.ts          # compromise + bad-words
│   │   ├── OpenAIAnalyzer.ts         # Fallback API
│   │   └── SentimentAnalyzer.ts      # Sentiment scoring
│   ├── rules/
│   │   ├── profanityRules.ts         # Custom word lists
│   │   ├── harassmentPatterns.ts     # Regex patterns
│   │   └── selfHarmIndicators.ts     # Detection rules
│   └── __tests__/
│       └── SafetyService.test.ts
├── ethics/
│   ├── EthicsService.ts
│   ├── calculators/
│   │   ├── GiniCalculator.ts         # Inequality metrics
│   │   ├── FairnessScorer.ts         # Scoring algorithm
│   │   └── DistributionAnalyzer.ts   # Payout analysis
│   ├── detectors/
│   │   ├── RedFlagDetector.ts        # Critical issues
│   │   └── YellowFlagDetector.ts     # Warnings
│   └── __tests__/
│       └── EthicsService.test.ts
├── evidence/
│   ├── EvidenceGenerator.ts
│   ├── templates/
│   │   ├── auditReport.hbs           # Handlebars template
│   │   ├── complianceCert.hbs        # Certificate template
│   │   └── styles.css                # PDF styling
│   ├── generators/
│   │   ├── PDFGenerator.ts           # PDFKit wrapper
│   │   ├── ChartGenerator.ts         # Visualizations
│   │   └── QRGenerator.ts            # QR code creation
│   └── __tests__/
│       └── EvidenceGenerator.test.ts
├── auditor/                           # Enhancement to existing service
│   └── AIEnhancedAuditor.ts          # Extends AuditorService
├── cache/
│   └── AICacheService.ts             # Caching layer
└── types/
    ├── safety.types.ts
    ├── ethics.types.ts
    └── evidence.types.ts
```

### 5.2 Base Service Class

```typescript
// /src/services/ai/base/BaseAIService.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export interface AIServiceConfig {
  cacheTTLSeconds: number;
  enableCaching: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export abstract class BaseAIService {
  protected prisma: PrismaClient;
  protected config: AIServiceConfig;
  protected serviceName: string;

  constructor(
    prisma: PrismaClient,
    serviceName: string,
    config: Partial<AIServiceConfig> = {}
  ) {
    this.prisma = prisma;
    this.serviceName = serviceName;
    this.config = {
      cacheTTLSeconds: 2592000, // 30 days
      enableCaching: true,
      maxRetries: 3,
      timeoutMs: 5000,
      ...config,
    };
  }

  /**
   * Hash input for privacy-preserving cache lookups
   */
  protected hashInput(input: any): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Check cache before running expensive operations
   */
  protected async checkCache<T>(inputHash: string): Promise<T | null> {
    if (!this.config.enableCaching) return null;

    try {
      const cached = await this.prisma.aICache.findUnique({
        where: { inputHash },
      });

      if (!cached) return null;

      // Check if expired
      if (new Date() > cached.expiresAt) {
        await this.prisma.aICache.delete({ where: { id: cached.id } });
        return null;
      }

      logger.debug(`Cache hit for ${this.serviceName}: ${inputHash}`);
      return cached.response as T;
    } catch (error) {
      logger.warn(`Cache check failed for ${this.serviceName}:`, error);
      return null;
    }
  }

  /**
   * Store result in cache
   */
  protected async setCache<T>(
    inputHash: string,
    response: T,
    confidence?: number
  ): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.config.cacheTTLSeconds);

      await this.prisma.aICache.create({
        data: {
          service: this.serviceName,
          inputHash,
          response: response as any,
          confidence,
          expiresAt,
        },
      });

      logger.debug(`Cached result for ${this.serviceName}: ${inputHash}`);
    } catch (error) {
      logger.warn(`Cache storage failed for ${this.serviceName}:`, error);
    }
  }

  /**
   * Retry wrapper for unreliable operations
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Retry ${this.config.maxRetries - retries + 1}/${this.config.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Timeout wrapper for long-running operations
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs = this.config.timeoutMs
  ): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }
}
```

### 5.3 SafetyService Implementation Template

```typescript
// /src/services/ai/safety/SafetyService.ts

import { PrismaClient } from '@prisma/client';
import { BaseAIService } from '../base/BaseAIService';
import { LocalAnalyzer } from './analyzers/LocalAnalyzer';
import { OpenAIAnalyzer } from './analyzers/OpenAIAnalyzer';
import { SafetyAnalysisResult, SafetyCategory } from '../types/safety.types';

export class SafetyService extends BaseAIService {
  private localAnalyzer: LocalAnalyzer;
  private apiAnalyzer: OpenAIAnalyzer;

  constructor(prisma: PrismaClient) {
    super(prisma, 'SAFETY', {
      cacheTTLSeconds: 604800, // 7 days for safety checks
      enableCaching: true,
    });

    this.localAnalyzer = new LocalAnalyzer();
    this.apiAnalyzer = new OpenAIAnalyzer();
  }

  /**
   * Analyze content for safety issues
   * Uses local analysis first, falls back to API for ambiguous cases
   */
  async analyzeContent(params: {
    content: string;
    entityType: string;
    entityId: string;
    authorId: string;
  }): Promise<SafetyAnalysisResult> {
    const inputHash = this.hashInput(params);

    // Check cache
    const cached = await this.checkCache<SafetyAnalysisResult>(inputHash);
    if (cached) return cached;

    // Step 1: Local analysis (fast, private)
    const localResult = await this.localAnalyzer.analyze(params.content);

    // Step 2: If high confidence OR clearly safe/harmful, skip API
    if (localResult.confidence > 0.85 || localResult.overallScore < 0.1 || localResult.overallScore > 0.9) {
      const result: SafetyAnalysisResult = {
        ...localResult,
        detectionMethod: 'LOCAL',
        flagged: localResult.overallScore > 0.6,
        autoBlocked: localResult.overallScore > 0.9,
      };

      // Store in database
      await this.storeResult(params, result);

      // Cache result
      await this.setCache(inputHash, result, localResult.confidence);

      return result;
    }

    // Step 3: Ambiguous case - use API for second opinion
    try {
      const apiResult = await this.withTimeout(
        this.apiAnalyzer.analyze(params.content),
        3000 // 3s timeout
      );

      const result: SafetyAnalysisResult = {
        overallScore: (localResult.overallScore + apiResult.overallScore) / 2,
        categories: this.mergeCategories(localResult.categories, apiResult.categories),
        confidence: Math.min(localResult.confidence, apiResult.confidence),
        detectionMethod: 'LOCAL+API',
        flagged: apiResult.overallScore > 0.6,
        autoBlocked: apiResult.overallScore > 0.9,
      };

      await this.storeResult(params, result);
      await this.setCache(inputHash, result, result.confidence);

      return result;
    } catch (error) {
      // API failed - use local result with lower confidence
      const result: SafetyAnalysisResult = {
        ...localResult,
        confidence: localResult.confidence * 0.8,
        detectionMethod: 'LOCAL',
        flagged: localResult.overallScore > 0.7, // Higher threshold due to uncertainty
        autoBlocked: false, // Don't auto-block without API confirmation
      };

      await this.storeResult(params, result);
      return result;
    }
  }

  /**
   * Auto-flag content and create incident if needed
   */
  async moderateAndFlag(params: {
    content: string;
    entityType: string;
    entityId: string;
    authorId: string;
  }): Promise<{ blocked: boolean; incidentId?: string }> {
    const analysis = await this.analyzeContent(params);

    if (!analysis.flagged) {
      return { blocked: false };
    }

    // Determine severity (1-5)
    const severity = this.calculateSeverity(analysis.overallScore);

    // Create safety incident
    const incident = await this.prisma.safetyIncident.create({
      data: {
        raisedById: 'SYSTEM', // AI-detected
        status: 'OPEN',
        category: this.getCategoryName(analysis.categories),
        severity,
        description: `AI-detected safety issue (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`,
        evidenceEventIds: [],
        aiDetected: true,
      },
    });

    return {
      blocked: analysis.autoBlocked,
      incidentId: incident.id,
    };
  }

  // ... (helper methods)

  private async storeResult(
    params: { entityType: string; entityId: string },
    result: SafetyAnalysisResult
  ): Promise<void> {
    await this.prisma.safetyModerationResult.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        overallScore: result.overallScore,
        categories: result.categories,
        flagged: result.flagged,
        autoBlocked: result.autoBlocked,
        detectionMethod: result.detectionMethod,
        confidence: result.confidence,
      },
    });
  }

  private calculateSeverity(score: number): number {
    if (score >= 0.9) return 5; // Critical
    if (score >= 0.75) return 4; // High
    if (score >= 0.6) return 3; // Medium
    if (score >= 0.4) return 2; // Low
    return 1; // Minimal
  }

  private getCategoryName(categories: Record<SafetyCategory, number>): string {
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const map: Record<SafetyCategory, string> = {
      harassment: 'HARASSMENT',
      hate: 'HATE',
      selfHarm: 'SELF_HARM',
      violence: 'VIOLENCE',
      sexual: 'SEXUAL',
      spam: 'SPAM',
    };
    return map[sorted[0][0] as SafetyCategory] || 'OTHER';
  }

  private mergeCategories(
    local: Record<SafetyCategory, number>,
    api: Record<SafetyCategory, number>
  ): Record<SafetyCategory, number> {
    const result: any = {};
    for (const key of Object.keys(local) as SafetyCategory[]) {
      result[key] = (local[key] + api[key]) / 2;
    }
    return result;
  }
}
```

### 5.4 Type Definitions

```typescript
// /src/services/ai/types/safety.types.ts

export type SafetyCategory =
  | 'harassment'
  | 'hate'
  | 'selfHarm'
  | 'violence'
  | 'sexual'
  | 'spam';

export interface SafetyAnalysisResult {
  overallScore: number; // 0.0 - 1.0
  categories: Record<SafetyCategory, number>;
  confidence: number; // 0.0 - 1.0
  detectionMethod: 'LOCAL' | 'API' | 'LOCAL+API' | 'MANUAL';
  flagged: boolean;
  autoBlocked: boolean;
}

export interface SafetyModerationInput {
  content: string;
  entityType: string;
  entityId: string;
  authorId: string;
}
```

```typescript
// /src/services/ai/types/ethics.types.ts

export type RedFlag =
  | 'SINGLE_CONTRIBUTOR_DOMINANCE' // One person >70% payout
  | 'UNPAID_WORK_DETECTED'          // Contributors with 0 payout
  | 'EXTREME_INEQUALITY'            // Gini > 0.7
  | 'MISSING_ATTRIBUTION'           // Contributions without manifest entry
  | 'SUSPICIOUS_TIMING'             // Manifest signed <1hr before payout
  | 'UNEXPLAINED_VARIANCE'          // Payout != manifest weights
  | 'NO_DIVERSE_ROLES'              // All contributors same type
  | 'EXPLOITATION_PATTERN';         // Historical pattern of unfairness

export interface EthicsAuditResult {
  fairnessScore: number; // 0.0 - 1.0
  giniCoefficient: number; // 0.0 - 1.0 (0 = perfect equality)
  redFlags: RedFlag[];
  yellowFlags: string[];
  greenFlags: string[];
  recommendations: Recommendation[];
  evidenceLinks: string[];
}

export interface Recommendation {
  type: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  description: string;
  actionRequired: boolean;
}
```

```typescript
// /src/services/ai/types/evidence.types.ts

export type EvidencePackageType =
  | 'PAYOUT_AUDIT'
  | 'COMPLIANCE_REPORT'
  | 'INCIDENT_EVIDENCE'
  | 'ETHICS_CERTIFICATION';

export interface EvidencePackageData {
  challengeId: string;
  packageType: EvidencePackageType;
  includeTimeline: boolean;
  includeFileHashes: boolean;
  includeSignatures: boolean;
  includeAIAnalysis: boolean;
}

export interface GeneratedEvidence {
  fileName: string;
  buffer: Buffer;
  metadata: {
    pages: number;
    generatedAt: string;
    verificationUrl: string;
    sha256: string;
  };
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (95% Coverage)

```typescript
// /src/services/ai/safety/__tests__/SafetyService.test.ts

describe('SafetyService', () => {
  let service: SafetyService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    service = new SafetyService(prisma);
  });

  describe('analyzeContent', () => {
    it('should detect profanity (local)', async () => {
      const result = await service.analyzeContent({
        content: 'This is fucking terrible',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      });

      expect(result.flagged).toBe(true);
      expect(result.detectionMethod).toBe('LOCAL');
      expect(result.categories.harassment).toBeGreaterThan(0.5);
    });

    it('should detect hate speech patterns', async () => {
      const result = await service.analyzeContent({
        content: '[hate speech test case]',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      });

      expect(result.flagged).toBe(true);
      expect(result.categories.hate).toBeGreaterThan(0.7);
    });

    it('should NOT flag normal content', async () => {
      const result = await service.analyzeContent({
        content: 'This is a great contribution to the project!',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      });

      expect(result.flagged).toBe(false);
      expect(result.overallScore).toBeLessThan(0.3);
    });

    it('should use cache on repeat calls', async () => {
      const params = {
        content: 'Test content',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      };

      const result1 = await service.analyzeContent(params);
      const result2 = await service.analyzeContent(params);

      expect(result1).toEqual(result2);
      // Verify cache hit in logs
    });

    it('should handle timeout gracefully', async () => {
      // Mock slow API call
      const result = await service.analyzeContent({
        content: 'Ambiguous content...',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      });

      expect(result.detectionMethod).toBe('LOCAL'); // Fallback
      expect(result.confidence).toBeLessThan(0.9); // Reduced confidence
    });
  });

  describe('moderateAndFlag', () => {
    it('should create incident for flagged content', async () => {
      const result = await service.moderateAndFlag({
        content: 'Severe violation content',
        entityType: 'CONTRIBUTION',
        entityId: 'test-id',
        authorId: 'user-id',
      });

      expect(result.blocked).toBe(true);
      expect(result.incidentId).toBeDefined();

      const incident = await prisma.safetyIncident.findUnique({
        where: { id: result.incidentId },
      });

      expect(incident?.aiDetected).toBe(true);
      expect(incident?.severity).toBeGreaterThan(3);
    });
  });
});
```

### 6.2 Integration Tests

```typescript
// /src/services/ai/__tests__/integration.test.ts

describe('AI Services Integration', () => {
  it('should run full payout audit workflow', async () => {
    // 1. Create challenge with contributions
    const challenge = await createTestChallenge();
    const contributions = await createTestContributions(challenge.id);

    // 2. Safety check all contributions
    const safetyService = new SafetyService(prisma);
    for (const contrib of contributions) {
      await safetyService.moderateAndFlag({
        content: contrib.content,
        entityType: 'CONTRIBUTION',
        entityId: contrib.id,
        authorId: contrib.userId,
      });
    }

    // 3. Run ethics audit
    const ethicsService = new EthicsService(prisma);
    const ethicsResult = await ethicsService.auditChallenge(challenge.id);

    expect(ethicsResult.redFlags.length).toBe(0);

    // 4. Generate evidence package
    const evidenceGenerator = new EvidenceGenerator(prisma);
    const evidence = await evidenceGenerator.createAuditPack({
      challengeId: challenge.id,
      packageType: 'PAYOUT_AUDIT',
      includeTimeline: true,
      includeFileHashes: true,
      includeSignatures: true,
      includeAIAnalysis: true,
    });

    expect(evidence.buffer).toBeDefined();
    expect(evidence.metadata.pages).toBeGreaterThan(1);
  });
});
```

### 6.3 Performance Tests

```typescript
// /src/services/ai/__tests__/performance.test.ts

describe('Performance Requirements', () => {
  it('should analyze content in <500ms (local)', async () => {
    const service = new SafetyService(prisma);
    const start = Date.now();

    await service.analyzeContent({
      content: 'Test content for performance',
      entityType: 'CONTRIBUTION',
      entityId: 'test-id',
      authorId: 'user-id',
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should generate PDF in <5s', async () => {
    const generator = new EvidenceGenerator(prisma);
    const start = Date.now();

    await generator.createAuditPack({
      challengeId: 'test-challenge',
      packageType: 'PAYOUT_AUDIT',
      includeTimeline: true,
      includeFileHashes: true,
      includeSignatures: true,
      includeAIAnalysis: true,
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

---

## 7. Cost Analysis

### 7.1 Estimated Monthly Costs (1000 active users, 500 challenges/month)

| Service | Provider | Usage | Cost/Month | Notes |
|---------|----------|-------|------------|-------|
| **SafetyService** | Local (compromise + bad-words) | Unlimited | $0 | Free, runs on server |
| **SafetyService** | OpenAI Moderation API | ~500 calls/mo | $0 | Free tier (no cost) |
| **EthicsService** | Local analytics | Unlimited | $0 | Pure TypeScript |
| **AuditorAI** | Local analytics | Unlimited | $0 | Pure PostgreSQL + TS |
| **EvidenceGenerator** | PDFKit (local) | ~500 PDFs/mo | $0 | Free library |
| **Compute** | Server CPU/RAM | +10% usage | ~$5 | Minimal overhead |
| **Storage** | PDF storage | ~5GB/mo | ~$0.12 | S3 or local |
| **Database** | PostgreSQL | +100MB/mo | ~$0 | Negligible |
| **TOTAL** | | | **~$5.12/mo** | 🎉 Budget-friendly! |

### 7.2 Scaling Estimates

**At 10,000 users, 5,000 challenges/month**:
- OpenAI Moderation: Still free (generous limits)
- Compute: ~$25/mo (need more CPU for local NLP)
- Storage: ~$1.20/mo (50GB PDFs)
- **Total**: ~$26.20/mo

**Cost per challenge**: $0.005 (half a penny!)

---

## 8. Privacy & Security Considerations

### 8.1 Privacy-First Design

**Principle**: Never send sensitive data to third parties without hashing/anonymizing

| Data Type | Privacy Measure | Reasoning |
|-----------|----------------|-----------|
| **User content** | Hash before caching | Prevent plaintext storage |
| **API calls** | Only for ambiguous cases | Minimize external exposure |
| **Personal data** | Strip before analysis | GDPR compliance |
| **File contents** | Local processing only | No upload to AI services |
| **Payout amounts** | Ratios only, not absolutes | Privacy in audits |

### 8.2 Security Measures

1. **Input Sanitization**: All content sanitized before AI analysis
2. **Rate Limiting**: Max 100 AI requests/user/hour
3. **Access Control**: AI endpoints require ADMIN/MODERATOR role
4. **Audit Logging**: All AI decisions logged to Event table
5. **Fail-Safe Defaults**: If AI fails, default to manual review (not auto-approve)

### 8.3 GDPR Compliance

- **Right to Explanation**: Store AI decision rationale in database
- **Right to Erasure**: Delete AI cache entries on user deletion
- **Data Minimization**: Only analyze necessary fields
- **Consent**: Users agree to AI moderation in ToS
- **Human Review**: All AI blocks can be appealed to human moderators

### 8.4 Bias Mitigation

**Challenge**: AI models can inherit biases from training data

**Mitigations**:
1. Use multiple detection methods (local + API) for consensus
2. Lower confidence scores trigger human review (not auto-block)
3. Regular audits of false positive/negative rates
4. Neurodivergent-friendly language not flagged as "abnormal"
5. Custom word lists reviewed by diverse team

---

## 9. Configuration Management

### 9.1 Environment Variables

Add to `.env`:

```bash
# ============================================================================
# AI SERVICES CONFIGURATION
# ============================================================================

# OpenAI (for fallback moderation)
OPENAI_API_KEY=sk-...  # Optional: Only for ambiguous safety cases
OPENAI_ORG_ID=org-...  # Optional

# AI Service Settings
AI_CACHE_ENABLED=true
AI_CACHE_TTL_DAYS=30
AI_SAFETY_THRESHOLD=0.6          # Flag content above this score
AI_SAFETY_AUTO_BLOCK_THRESHOLD=0.9  # Auto-block above this score
AI_ETHICS_MIN_FAIRNESS_SCORE=0.7    # Minimum acceptable fairness

# Evidence Generation
EVIDENCE_STORAGE_PATH=/home/matt/backend/evidence
EVIDENCE_BASE_URL=https://oddly-brilliant.com/verify

# Feature Flags
ENABLE_AI_MODERATION=true
ENABLE_AI_ETHICS_CHECKS=true
ENABLE_AUTO_BLOCKING=false  # Set true in production after testing
```

### 9.2 Feature Flags

```typescript
// /src/config/aiConfig.ts

export const aiConfig = {
  safety: {
    enabled: process.env.ENABLE_AI_MODERATION === 'true',
    threshold: parseFloat(process.env.AI_SAFETY_THRESHOLD || '0.6'),
    autoBlockThreshold: parseFloat(process.env.AI_SAFETY_AUTO_BLOCK_THRESHOLD || '0.9'),
    enableCaching: process.env.AI_CACHE_ENABLED === 'true',
    cacheTTLDays: parseInt(process.env.AI_CACHE_TTL_DAYS || '30'),
  },
  ethics: {
    enabled: process.env.ENABLE_AI_ETHICS_CHECKS === 'true',
    minFairnessScore: parseFloat(process.env.AI_ETHICS_MIN_FAIRNESS_SCORE || '0.7'),
    giniThreshold: 0.7, // Extreme inequality
    dominanceThreshold: 0.7, // Single contributor limit
  },
  evidence: {
    storagePath: process.env.EVIDENCE_STORAGE_PATH || '/home/matt/backend/evidence',
    baseUrl: process.env.EVIDENCE_BASE_URL || 'http://localhost:3001/verify',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    enabled: !!process.env.OPENAI_API_KEY,
  },
};
```

---

## 10. API Endpoints

### 10.1 Safety Moderation

```typescript
/**
 * POST /api/admin/safety/analyze
 * Analyze content for safety issues
 *
 * Body: {
 *   content: string;
 *   entityType: string;
 *   entityId: string;
 * }
 *
 * Response: SafetyAnalysisResult
 */

/**
 * POST /api/admin/safety/moderate/:entityType/:entityId
 * Auto-moderate and flag if needed
 *
 * Response: {
 *   blocked: boolean;
 *   incidentId?: string;
 * }
 */

/**
 * GET /api/admin/safety/results/:entityType/:entityId
 * Get moderation results for entity
 *
 * Response: SafetyModerationResult[]
 */
```

### 10.2 Ethics Auditing

```typescript
/**
 * POST /api/admin/ethics/audit/:challengeId
 * Run ethics audit on challenge
 *
 * Response: EthicsAuditResult
 */

/**
 * GET /api/admin/ethics/audits/:challengeId
 * Get all ethics audits for challenge
 *
 * Response: EthicsAudit[]
 */
```

### 10.3 Evidence Generation

```typescript
/**
 * POST /api/admin/evidence/generate/:challengeId
 * Generate evidence package
 *
 * Body: {
 *   packageType: EvidencePackageType;
 *   includeTimeline?: boolean;
 *   includeFileHashes?: boolean;
 *   includeSignatures?: boolean;
 *   includeAIAnalysis?: boolean;
 * }
 *
 * Response: {
 *   packageId: string;
 *   downloadUrl: string;
 *   verificationUrl: string;
 * }
 */

/**
 * GET /api/verify/:packageId
 * Public verification endpoint (shows metadata, not full PDF)
 *
 * Response: {
 *   challengeId: string;
 *   generatedAt: string;
 *   sha256: string;
 *   verified: boolean;
 * }
 */
```

---

## 11. Migration Plan

### 11.1 Database Migration

```bash
# Create Prisma migration
npx prisma migrate dev --name add_ai_services

# Migration will include:
# - AICache table
# - SafetyModerationResult table
# - EthicsAudit table
# - EvidencePackage table
# - Updates to SafetyIncident, Challenge
```

### 11.2 Dependency Installation

```bash
# Install AI service dependencies
npm install --save \
  compromise \
  bad-words \
  openai \
  pdfkit \
  handlebars \
  qrcode \
  chart.js \
  canvas

# Install type definitions
npm install --save-dev \
  @types/pdfkit \
  @types/qrcode
```

### 11.3 Rollout Strategy

**Phase 1: Shadow Mode (Week 1-2)**
- Deploy AI services with `ENABLE_AUTO_BLOCKING=false`
- Log all decisions but don't enforce
- Monitor for false positives

**Phase 2: Assisted Mode (Week 3-4)**
- Enable flagging (create incidents)
- Human moderators review AI decisions
- Tune thresholds based on feedback

**Phase 3: Active Mode (Week 5+)**
- Enable auto-blocking for severity 5
- Auto-flag severity 3-4 (human review)
- Full production deployment

---

## 12. Monitoring & Observability

### 12.1 Key Metrics

```typescript
// Track in application logs
- ai.safety.analysis.duration_ms
- ai.safety.cache_hit_rate
- ai.safety.flagged_rate
- ai.safety.false_positive_rate
- ai.ethics.audit.duration_ms
- ai.evidence.generation.duration_ms
- ai.evidence.generation.file_size_bytes
```

### 12.2 Alerting

**Critical Alerts**:
- AI service downtime >5min
- False positive rate >20%
- Evidence generation failures
- API quota exceeded (OpenAI)

**Warning Alerts**:
- Cache hit rate <50%
- Response time >2s
- High severity incidents spike

---

## 13. Future Enhancements (Phase 4.3+)

1. **ML Model Training**: Train custom models on platform data (better accuracy)
2. **Sentiment Trends**: Track contributor sentiment over time (burnout detection)
3. **Predictive Analytics**: Predict challenge success based on composition patterns
4. **Automated Negotiation**: AI suggests fair payout splits based on historical data
5. **Blockchain Integration**: Publish evidence packages to IPFS + Ethereum
6. **Multi-language Support**: Detect safety issues in non-English content
7. **Image Moderation**: Scan uploaded files for inappropriate content
8. **Voice-to-Text**: Support neurodivergent users with audio contributions

---

## 14. Conclusion

This architecture provides a **production-ready, budget-conscious, privacy-first** AI integration for the Oddly Brilliant platform. Key highlights:

- **$5/month operating cost** (can scale to 10k users for <$30/mo)
- **Local-first processing** (no sensitive data sent externally)
- **Simple, auditable algorithms** (transparency for governance)
- **Fast response times** (<500ms moderation, <5s evidence generation)
- **Extensible design** (easy to add more AI services)

The phased implementation approach allows for testing and tuning before full deployment, minimizing risk while maximizing value.

---

## Appendix A: Dependency Versions

```json
{
  "dependencies": {
    "compromise": "^14.10.0",
    "bad-words": "^3.0.4",
    "openai": "^4.20.0",
    "pdfkit": "^0.14.0",
    "handlebars": "^4.7.8",
    "qrcode": "^1.5.3",
    "chart.js": "^4.4.0",
    "canvas": "^2.11.2"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.3",
    "@types/qrcode": "^1.5.5"
  }
}
```

## Appendix B: Sample Evidence Package

```
┌─────────────────────────────────────────────────┐
│       ODDLY BRILLIANT AUDIT CERTIFICATE         │
│         Challenge: #CH-12345                    │
│         Generated: 2025-10-25 14:32:05 UTC      │
└─────────────────────────────────────────────────┘

CHALLENGE OVERVIEW
─────────────────────────────────────────────────
Title: Build Mobile App Authentication
Bounty: 5,000 USDC
Status: COMPLETED
Project Leader: alice@example.com

CONTRIBUTION BREAKDOWN
─────────────────────────────────────────────────
┌─────────────────┬──────────┬──────────┬─────────┐
│ Contributor     │ Type     │ Weight   │ Payout  │
├─────────────────┼──────────┼──────────┼─────────┤
│ alice@...       │ CODE     │ 40.0%    │ 2,000   │
│ bob@...         │ DESIGN   │ 30.0%    │ 1,500   │
│ charlie@...     │ CODE     │ 20.0%    │ 1,000   │
│ dana@...        │ RESEARCH │ 10.0%    │   500   │
└─────────────────┴──────────┴──────────┴─────────┘

COMPLIANCE CHECKS
─────────────────────────────────────────────────
✓ KYC/AML verified (4/4 contributors)
✓ Composition manifest signed
✓ IP assignments collected
✓ Payout within tolerance
✓ Safety checks passed
✓ Ethics audit: PASS (fairness score: 0.89)

ETHICS ANALYSIS
─────────────────────────────────────────────────
Gini Coefficient: 0.42 (moderate inequality)
Fairness Score: 0.89/1.00
Red Flags: None
Yellow Flags: None
Green Flags:
  ✓ Diverse contribution types
  ✓ No single contributor dominance
  ✓ All contributors compensated

EVENT TIMELINE
─────────────────────────────────────────────────
2025-10-01 09:15 | Challenge created (alice@...)
2025-10-02 14:22 | First contribution (bob@...)
2025-10-15 11:45 | Manifest signed (alice@...)
2025-10-20 16:30 | Payout proposed (alice@...)
2025-10-22 10:00 | Sponsor approved
2025-10-25 14:32 | Evidence package generated

FILE INTEGRITY
─────────────────────────────────────────────────
design-mockups.fig    | SHA256: a3f2c1e...
auth-implementation.ts| SHA256: 9b4d8f3...
research-report.pdf   | SHA256: 7c2a9e1...

VERIFICATION
─────────────────────────────────────────────────
Package SHA256: e8f3a2c1d9b7f4e6a3c2d1e9f8a7b6c5
Verification URL: [QR CODE]
https://oddly-brilliant.com/verify/pkg_abc123

SIGNATURES
─────────────────────────────────────────────────
Project Leader: [SIGNED] alice@... (2025-10-15)
Sponsor: [SIGNED] sponsor@... (2025-10-22)
Auditor: [AI-VERIFIED] System (2025-10-25)

─────────────────────────────────────────────────
This document is cryptographically signed and
tamper-evident. Verify authenticity at the URL
above or scan the QR code.

Generated by Oddly Brilliant AI Auditor v1.0
─────────────────────────────────────────────────
```

---

**END OF ARCHITECTURE DOCUMENT**
