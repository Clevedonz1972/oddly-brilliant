# AI Services User Guide
**oddly-brilliant Platform**
**Version:** Phase 4.2 Complete
**Last Updated:** 2025-10-25

---

## Table of Contents
1. [Overview](#overview)
2. [SafetyService - Content Moderation](#safetyservice---content-moderation)
3. [EthicsService - Fairness Auditing](#ethicsservice---fairness-auditing)
4. [EvidenceGenerator - Audit Packages](#evidencegenerator---audit-packages)
5. [API Reference](#api-reference)
6. [Integration Guide](#integration-guide)
7. [Troubleshooting](#troubleshooting)
8. [Cost & Performance](#cost--performance)

---

## Overview

The oddly-brilliant platform includes **three AI services** designed to ensure platform safety, fairness, and auditability:

| Service | Purpose | Cost | Response Time |
|---------|---------|------|---------------|
| **SafetyService** | Content moderation (harassment, hate, spam, etc.) | ~$5/month | <500ms |
| **EthicsService** | Fairness auditing (Gini coefficient, red flags) | $0 (pure logic) | <200ms |
| **EvidenceGenerator** | Generate tamper-evident PDF audit packages | $0 (local) | <5s |

### Key Features

✅ **Privacy-First**: 95%+ local processing, minimal external API calls
✅ **Budget-Conscious**: ~$5/month total operating cost
✅ **Production-Ready**: Fast, cached, error-tolerant
✅ **Auditable**: All decisions logged to database
✅ **Type-Safe**: Full TypeScript support

---

## SafetyService - Content Moderation

### What It Does

SafetyService analyzes user-submitted content for safety issues using a **hybrid local+API approach**:
- **Step 1**: Local analysis (compromise-nlp + bad-words) - fast, private, free
- **Step 2**: If ambiguous → OpenAI Moderation API fallback
- **Step 3**: Creates incidents for flagged content

### Safety Categories

| Category | Examples | Weight |
|----------|----------|--------|
| **harassment** | Personal attacks, bullying, threats | 1.2x |
| **hate** | Hate speech, slurs, discrimination | 1.5x |
| **selfHarm** | Suicide references, self-harm | 2.0x (highest) |
| **violence** | Violent threats, weapons | 1.3x |
| **sexual** | Sexual content, explicit material | 1.0x |
| **spam** | Scams, excessive caps, "click here!" | 0.5x |

### Severity Levels

- **Score 0.9+** → Severity 5 (Critical) → **Auto-block**
- **Score 0.75-0.9** → Severity 4 (High) → Flag + incident
- **Score 0.6-0.75** → Severity 3 (Medium) → Flag + incident
- **Score 0.4-0.6** → Severity 2 (Low) → Flag (no incident)
- **Score <0.4** → Severity 1 (Minimal) → Pass

### API Usage

#### Analyze Content

```bash
POST /api/admin/safety/analyze
Authorization: Bearer <admin-token>

{
  "content": "User-submitted text to analyze",
  "entityType": "CONTRIBUTION",
  "entityId": "contrib-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 0.15,
    "categories": {
      "harassment": 0.1,
      "hate": 0.05,
      "selfHarm": 0.0,
      "violence": 0.0,
      "sexual": 0.0,
      "spam": 0.2
    },
    "confidence": 0.92,
    "detectionMethod": "LOCAL",
    "flagged": false,
    "autoBlocked": false
  }
}
```

#### Auto-Moderate and Flag

```bash
POST /api/admin/safety/moderate/CONTRIBUTION/contrib-123
Authorization: Bearer <admin-token>

{
  "content": "Flagged content here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blocked": true,
    "incidentId": "incident-abc123"
  }
}
```

### When to Use

- ✅ Before accepting contributions
- ✅ Before publishing challenge descriptions
- ✅ On comment submissions
- ✅ During user profile updates
- ❌ On every page load (too expensive)
- ❌ On pre-approved content

### Configuration

Environment variables (`.env`):
```bash
# OpenAI API (optional - for fallback)
OPENAI_API_KEY=sk-...  # Free tier available

# Thresholds
AI_SAFETY_THRESHOLD=0.6          # Flag above this
AI_SAFETY_AUTO_BLOCK_THRESHOLD=0.9  # Auto-block above this

# Feature flags
ENABLE_AI_MODERATION=true
ENABLE_AUTO_BLOCKING=false  # Set true after testing
```

---

## EthicsService - Fairness Auditing

### What It Does

EthicsService performs **statistical fairness analysis** on challenge payouts using:
- **Gini Coefficient**: Measures inequality (0 = perfect equality, 1 = extreme inequality)
- **Red Flag Detection**: 8 patterns indicating unfairness
- **Green Flag Detection**: 4 patterns indicating good practices
- **Fairness Scoring**: 0.0-1.0 score based on Gini + flags

### Red Flags (8 Patterns)

| Flag | Description | Threshold |
|------|-------------|-----------|
| `SINGLE_CONTRIBUTOR_DOMINANCE` | One person gets >70% of payout | >70% |
| `UNPAID_WORK_DETECTED` | Contributors with 0 payout | Any $0 |
| `EXTREME_INEQUALITY` | Very unequal distribution | Gini > 0.7 |
| `MISSING_ATTRIBUTION` | Contributions without manifest entry | Any missing |
| `SUSPICIOUS_TIMING` | Manifest signed <1hr before payout | <1 hour |
| `UNEXPLAINED_VARIANCE` | Payout % != manifest weight % | >5% diff |
| `NO_DIVERSE_ROLES` | All same contribution type | All identical |
| `EXPLOITATION_PATTERN` | User has history of disputes | ≥3 disputes |

### Green Flags (4 Positive Patterns)

| Flag | Description |
|------|-------------|
| `DIVERSE_CONTRIBUTION_TYPES` | 3+ different contribution types |
| `ALL_CONTRIBUTORS_PAID` | No zero payouts |
| `FAIR_DISTRIBUTION` | Gini < 0.4 (low inequality) |
| `TRANSPARENT_MANIFEST` | Signed >24hrs before payout |

### Fairness Score Calculation

```
Score = 1.0
Score -= (Gini × 0.3)
Score -= (RedFlags × 0.15)
Score += (GreenFlags × 0.05)
Score = clamp(Score, 0.0, 1.0)
```

**Interpretation:**
- **0.7-1.0**: Excellent fairness
- **0.5-0.7**: Acceptable
- **0.3-0.5**: Concerning (manual review recommended)
- **<0.3**: Critical (block payout)

### API Usage

#### Run Ethics Audit

```bash
POST /api/admin/ethics/audit/challenge-123
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fairnessScore": 0.85,
    "giniCoefficient": 0.42,
    "redFlags": [],
    "yellowFlags": [],
    "greenFlags": [
      "DIVERSE_CONTRIBUTION_TYPES",
      "ALL_CONTRIBUTORS_PAID",
      "FAIR_DISTRIBUTION"
    ],
    "recommendations": [
      {
        "type": "SUGGESTION",
        "description": "Consider documenting the rationale for payout distribution",
        "actionRequired": false
      }
    ],
    "evidenceLinks": ["event-1", "event-2", "manifest-hash-abc"]
  }
}
```

#### Get Ethics Report

```bash
GET /api/admin/ethics/report/challenge-123
Authorization: Bearer <admin-token>
```

### When to Use

- ✅ **MANDATORY**: Before releasing challenge payout
- ✅ During payout proposal review
- ✅ After manifest submission
- ✅ For compliance reporting
- ❌ During active development (wait for manifest)

### Recommendations by Flag

| Red Flag | Recommendation | Action Required |
|----------|----------------|-----------------|
| `SINGLE_CONTRIBUTOR_DOMINANCE` | Verify contributor did 70%+ of work | Manual review |
| `UNPAID_WORK_DETECTED` | Ensure all contributors compensated | **CRITICAL** |
| `EXTREME_INEQUALITY` | Review payout distribution fairness | Manual review |
| `UNEXPLAINED_VARIANCE` | Align payout with manifest weights | Update proposal |

---

## EvidenceGenerator - Audit Packages

### What It Does

EvidenceGenerator creates **tamper-evident PDF audit packages** containing:
- Challenge overview (title, bounty, participants)
- Compliance check results
- Ethics analysis (Gini, flags, score)
- Event timeline (chronological audit trail)
- File integrity (SHA256 hashes)
- QR code for public verification

### PDF Structure

```
┌─────────────────────────────────────────────────┐
│   ODDLY BRILLIANT AUDIT CERTIFICATE             │
│   Challenge: #CH-12345                          │
│   Generated: 2025-10-25 14:32:05 UTC            │
└─────────────────────────────────────────────────┘

CHALLENGE OVERVIEW
────────────────────────────────────────────
Title: Build Mobile App Authentication
Bounty: 5,000 USDC
Status: COMPLETED
Project Leader: alice@example.com

CONTRIBUTION BREAKDOWN
────────────────────────────────────────────
┌─────────────┬──────────┬──────────┬─────────┐
│ Contributor │ Type     │ Weight   │ Payout  │
├─────────────┼──────────┼──────────┼─────────┤
│ alice@...   │ CODE     │ 40.0%    │ 2,000   │
│ bob@...     │ DESIGN   │ 30.0%    │ 1,500   │
│ charlie@... │ CODE     │ 20.0%    │ 1,000   │
│ dana@...    │ RESEARCH │ 10.0%    │   500   │
└─────────────┴──────────┴──────────┴─────────┘

COMPLIANCE CHECKS
────────────────────────────────────────────
✓ KYC/AML verified (4/4 contributors)
✓ Composition manifest signed
✓ IP assignments collected
✓ Payout within tolerance
✓ Safety checks passed
✓ Ethics audit: PASS (fairness score: 0.89)

ETHICS ANALYSIS
────────────────────────────────────────────
Gini Coefficient: 0.42 (moderate inequality)
Fairness Score: 0.89/1.00
Red Flags: None
Green Flags:
  ✓ Diverse contribution types
  ✓ No single contributor dominance
  ✓ All contributors compensated

EVENT TIMELINE
────────────────────────────────────────────
2025-10-01 09:15 | Challenge created
2025-10-02 14:22 | First contribution
2025-10-15 11:45 | Manifest signed
2025-10-20 16:30 | Payout proposed
2025-10-22 10:00 | Sponsor approved
2025-10-25 14:32 | Evidence generated

FILE INTEGRITY
────────────────────────────────────────────
design-mockups.fig    | SHA256: a3f2c1e...
auth-implementation.ts| SHA256: 9b4d8f3...
research-report.pdf   | SHA256: 7c2a9e1...

VERIFICATION
────────────────────────────────────────────
Package SHA256: e8f3a2c1d9b7f4e6a3c2d1e9f8a7b6c5
Verification URL: [QR CODE]
https://oddly-brilliant.com/verify/pkg_abc123
```

### API Usage

#### Generate Evidence Package

```bash
POST /api/admin/evidence/generate/challenge-123
Authorization: Bearer <admin-token>

{
  "packageType": "PAYOUT_AUDIT",
  "includeTimeline": true,
  "includeFileHashes": true,
  "includeSignatures": true,
  "includeAIAnalysis": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "packageId": "e8f3a2c1d9b7f4e6a3c2d1e9f8a7b6c5",
    "fileName": "audit_challenge-123_2025-10-25.pdf",
    "pages": 5,
    "generatedAt": "2025-10-25T14:32:05Z",
    "verificationUrl": "https://oddly-brilliant.com/verify/pkg_abc123",
    "sha256": "e8f3a2c1d9b7f4e6a3c2d1e9f8a7b6c5"
  }
}
```

#### Download Package

```bash
GET /api/admin/evidence/download/:packageId
Authorization: Bearer <admin-token>
```

Returns PDF file for download.

#### Verify Package Integrity

```bash
GET /api/admin/evidence/verify/:packageId
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "expectedHash": "e8f3a2c1...",
    "actualHash": "e8f3a2c1...",
    "matchesDatabase": true,
    "packageExists": true
  }
}
```

### Package Types

| Type | Description | Use Case |
|------|-------------|----------|
| `PAYOUT_AUDIT` | Full audit for payout release | Before payment |
| `COMPLIANCE_REPORT` | Compliance status snapshot | Quarterly reports |
| `INCIDENT_EVIDENCE` | Safety incident documentation | Legal/moderation |
| `ETHICS_CERTIFICATION` | Fairness audit certificate | Transparency |

### When to Use

- ✅ **MANDATORY**: Before releasing payout (PAYOUT_AUDIT)
- ✅ For legal compliance records
- ✅ For public transparency
- ✅ For dispute resolution
- ❌ For in-progress challenges (wait until complete)

### Storage

- **Location**: `/home/matt/backend/evidence/`
- **Format**: PDF (A4)
- **Naming**: `audit_{challengeId}_{timestamp}.pdf`
- **Retention**: Permanent (never auto-delete)

---

## API Reference

### Base URL

```
http://localhost:3001/api/admin
```

### Authentication

All AI service endpoints require **ADMIN** role:

```bash
Authorization: Bearer <admin-jwt-token>
```

### Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/safety/analyze` | POST | Analyze content safety |
| `/safety/moderate/:type/:id` | POST | Auto-moderate and flag |
| `/safety/results/:type/:id` | GET | Get moderation history |
| `/ethics/audit/:challengeId` | POST | Run ethics audit |
| `/ethics/audits/:challengeId` | GET | Get audit history |
| `/ethics/report/:challengeId` | GET | Get ethics report |
| `/evidence/generate/:challengeId` | POST | Generate evidence PDF |
| `/evidence/download/:packageId` | GET | Download PDF |
| `/evidence/verify/:packageId` | GET | Verify integrity |
| `/evidence/list/:challengeId` | GET | List all packages |

---

## Integration Guide

### Recommended Workflow

```
1. Challenge Created
   ↓
2. Contributions Submitted
   ├─→ SafetyService.analyze() - Check each contribution
   └─→ Create SafetyIncident if flagged
   ↓
3. Manifest Submitted
   ↓
4. Payout Proposed
   ├─→ EthicsService.audit() - Check fairness
   └─→ Block if fairness < 0.5
   ↓
5. Pre-Release Checks
   ├─→ AuditorService.heartbeat() - Compliance
   └─→ AuditorService.validatePayout() - Final check
   ↓
6. Evidence Generation
   ├─→ EvidenceGenerator.createAuditPack()
   └─→ Store package URL in PayoutProposal
   ↓
7. Payout Released
```

### Code Example (Node.js)

```typescript
import { SafetyService } from './services/ai/safety/SafetyService';
import { EthicsService } from './services/ai/ethics/EthicsService';
import { EvidenceGenerator } from './services/ai/evidence/EvidenceGenerator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const safetyService = new SafetyService(prisma);
const ethicsService = new EthicsService(prisma);
const evidenceGenerator = new EvidenceGenerator(prisma);

// 1. Check contribution safety
async function checkContribution(content: string, contributionId: string) {
  const result = await safetyService.moderateAndFlag({
    content,
    entityType: 'CONTRIBUTION',
    entityId: contributionId,
    authorId: 'user-123',
  });

  if (result.blocked) {
    throw new Error(`Content blocked: ${result.incidentId}`);
  }
}

// 2. Audit payout fairness
async function auditPayout(challengeId: string) {
  const audit = await ethicsService.auditChallenge(challengeId);

  if (audit.fairnessScore < 0.5) {
    throw new Error(`Fairness score too low: ${audit.fairnessScore}`);
  }

  return audit;
}

// 3. Generate evidence package
async function createAuditTrail(challengeId: string) {
  const evidence = await evidenceGenerator.createAuditPack({
    challengeId,
    packageType: 'PAYOUT_AUDIT',
    includeTimeline: true,
    includeFileHashes: true,
    includeSignatures: true,
    includeAIAnalysis: true,
  });

  return evidence.metadata.verificationUrl;
}

// Full workflow
async function processPayoutRelease(challengeId: string) {
  try {
    // Step 1: Ethics audit
    const audit = await auditPayout(challengeId);
    console.log(`Fairness score: ${audit.fairnessScore}`);

    // Step 2: Generate evidence
    const verificationUrl = await createAuditTrail(challengeId);
    console.log(`Evidence package: ${verificationUrl}`);

    // Step 3: Release payout
    // ... (blockchain transaction logic)

    return { success: true, verificationUrl };
  } catch (error) {
    console.error('Payout release failed:', error);
    throw error;
  }
}
```

---

## Troubleshooting

### Common Issues

#### SafetyService: "OpenAI API error"

**Problem**: API fallback fails
**Solution**: Check `OPENAI_API_KEY` in `.env` or disable with `ENABLE_AI_MODERATION=false`
**Workaround**: Service falls back to local-only analysis

#### EthicsService: "No payout proposal found"

**Problem**: Running audit before payout proposed
**Solution**: Wait until `PayoutProposal` exists for challenge
**Workaround**: Create draft proposal before audit

#### EvidenceGenerator: "Challenge not found"

**Problem**: Invalid challengeId
**Solution**: Verify challenge exists in database
**Debug**: Check `prisma.challenge.findUnique({ where: { id } })`

#### EvidenceGenerator: "PDF generation failed"

**Problem**: Missing data (manifest, events, etc.)
**Solution**: Ensure challenge is complete with all required data
**Workaround**: Set `includeX: false` flags to skip optional sections

### Performance Optimization

#### Cache Hit Rate Low (<50%)

**Problem**: Too many unique content strings
**Solution**: Normalize content before analysis (trim, lowercase)

#### Slow PDF Generation (>10s)

**Problem**: Too many events or files
**Solution**: Limit timeline to last 100 events
**Workaround**: Use pagination or filtering

### Debugging

Enable detailed logging:

```typescript
// In BaseAIService
console.log(`[${this.serviceName}] Operation started`);
console.log(`[${this.serviceName}] Cache hit: ${inputHash}`);
console.log(`[${this.serviceName}] Result: ${JSON.stringify(result)}`);
```

Check database for stored results:

```sql
SELECT * FROM safety_moderation_results WHERE entity_id = 'contrib-123';
SELECT * FROM ethics_audits WHERE challenge_id = 'challenge-123';
SELECT * FROM evidence_packages WHERE challenge_id = 'challenge-123';
```

---

## Cost & Performance

### Monthly Costs (1000 users, 500 challenges/month)

| Service | Provider | Cost |
|---------|----------|------|
| SafetyService (local) | compromise + bad-words | $0 |
| SafetyService (API fallback) | OpenAI Moderation | $0 (free tier) |
| EthicsService | Pure TypeScript | $0 |
| EvidenceGenerator | PDFKit (local) | $0 |
| Server CPU overhead | | ~$5 |
| Storage (PDFs) | Local disk | ~$0.12 |
| **TOTAL** | | **~$5.12/month** |

### Performance Benchmarks

| Operation | Target | Typical |
|-----------|--------|---------|
| Safety analysis (local) | <500ms | 150-300ms |
| Safety analysis (local+API) | <3s | 1-2s |
| Ethics audit | <200ms | 50-150ms |
| Evidence generation | <5s | 2-4s |
| Cache lookup | <10ms | 2-5ms |

### Scaling Estimates

**At 10,000 users, 5,000 challenges/month:**
- OpenAI Moderation: Still free (generous limits)
- Server CPU: ~$25/month (need more for local NLP)
- Storage: ~$1.20/month (500GB PDFs)
- **Total**: ~$26.20/month
- **Cost per challenge**: $0.005 (half a penny!)

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/Clevedonz1972/oddly-brilliant/issues
- **Architecture Doc**: `/home/matt/backend/PHASE_4_2_AI_ARCHITECTURE.md`
- **Backend Context**: `/home/matt/backend/.claude/CLAUDE.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-25
**Phase**: 4.2 Complete
