# Quick Start Guide - Phase 2 Features

## TL;DR - What's New?

Three critical features are now live:

1. **Challenge Completion** - `POST /api/challenges/:id/complete`
2. **Auto Token Calculation** - Token values now calculated automatically
3. **Payment Distribution** - Fair payment splitting service

---

## Quick Setup (3 Steps)

### 1. Update Database
```bash
cd /home/matt/backend
npx prisma generate              # Already done
npx prisma migrate dev           # Run if needed
```

### 2. Verify Build
```bash
npm run build                    # Should show 0 errors
npm run test                     # Should show all tests passing
```

### 3. Start Server
```bash
npm run dev                      # Start development server
```

---

## Quick Test Workflow

### Complete Flow in 4 API Calls:

```bash
# 1. Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'

export TOKEN="your-jwt-token"

# 2. Create Challenge
curl -X POST http://localhost:3000/api/challenges \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Build Authentication System",
    "description":"Need help implementing JWT auth",
    "bountyAmount":1000
  }'

export CHALLENGE_ID="returned-challenge-id"

# 3. Add Contribution (token value auto-calculated!)
curl -X POST http://localhost:3000/api/contributions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "challengeId":"'$CHALLENGE_ID'",
    "content":"Implemented complete JWT authentication with refresh tokens",
    "type":"CODE"
  }'

# Note: tokenValue is now AUTO-CALCULATED (30 for CODE)
# No need to include it in the request!

# 4. Complete Challenge (as sponsor)
curl -X POST http://localhost:3000/api/challenges/$CHALLENGE_ID/complete \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Updated challenge (status: COMPLETED)
# - Payment records for all contributors
# - Payment breakdown with percentages
```

---

## Token Values Reference

```
CODE:     30 tokens  ← Highest value (working code)
DESIGN:   25 tokens  ← Visual/UX work
IDEA:     20 tokens  ← Concepts/approaches
RESEARCH: 15 tokens  ← Background work
```

**Important:** These are calculated automatically on the server.
Don't send `tokenValue` in contribution requests anymore!

---

## Payment Calculation Example

### Scenario:
- Challenge Bounty: **$1,000**
- Contributions:
  - Alice: CODE (30 tokens)
  - Bob: DESIGN (25 tokens)
  - Carol: IDEA (20 tokens)

### Calculation:
```
Total Tokens: 30 + 25 + 20 = 75

Alice:  (30 / 75) × $1,000 = $400.00 (40%)
Bob:    (25 / 75) × $1,000 = $333.33 (33.33%)
Carol:  (20 / 75) × $1,000 = $266.67 (26.67%)
                              ─────────
                              $1,000.00 ✓
```

---

## API Changes Summary

### ❌ Breaking Change:
**POST /api/contributions** no longer accepts `tokenValue`

**Before (Phase 1):**
```json
{
  "challengeId": "uuid",
  "content": "My contribution",
  "type": "CODE",
  "tokenValue": 30  ← Don't send this anymore!
}
```

**After (Phase 2):**
```json
{
  "challengeId": "uuid",
  "content": "My contribution",
  "type": "CODE"
}
```

The server automatically calculates tokenValue based on type.

### ✅ New Endpoint:
**POST /api/challenges/:id/complete**

Completes a challenge and creates payments in one call.

**Requirements:**
- Must be authenticated
- Must be the challenge sponsor
- Challenge must be IN_PROGRESS

**Returns:**
```json
{
  "success": true,
  "data": {
    "challenge": { /* completed challenge */ },
    "payments": [ /* payment records */ ],
    "paymentSummary": {
      "totalAmount": 1000,
      "totalRecipients": 3,
      "splits": [ /* detailed breakdown */ ]
    }
  }
}
```

---

## File Locations

### New Service:
```
/home/matt/backend/src/services/payment.service.ts
```

### Key Functions:
```typescript
// In helpers.ts
calculateTokenValue(type: ContributionType): number

// In payment.service.ts
paymentService.calculatePaymentSplits(challengeId: string)
paymentService.distributePayments(challengeId, splits, method)
paymentService.getUserPayments(userId: string)
paymentService.getUserTotalEarnings(userId: string)
```

### Updated Controllers:
```
/home/matt/backend/src/controllers/challenges.controller.ts
  └─ completeChallenge() method added

/home/matt/backend/src/controllers/contributions.controller.ts
  └─ createContribution() now auto-calculates tokenValue
```

---

## Common Errors & Solutions

### "Challenge must be in progress"
**Cause:** Trying to complete a challenge with no contributions
**Solution:** Add at least one contribution first

### "Only the challenge sponsor can complete it"
**Cause:** Non-sponsor trying to complete challenge
**Solution:** Use sponsor's JWT token

### "Challenge is already completed"
**Cause:** Trying to complete an already completed challenge
**Solution:** Each challenge can only be completed once

### "tokenValue is not allowed"
**Cause:** Sending tokenValue in contribution request
**Solution:** Remove tokenValue from request body (auto-calculated now)

---

## Development Tips

### Testing Payment Calculations:
```typescript
import { paymentService } from './services/payment.service';

// Calculate splits without creating payments
const splits = await paymentService.calculatePaymentSplits(challengeId);
console.log(splits);
```

### Checking Token Values:
```typescript
import { calculateTokenValue } from './utils/helpers';

console.log(calculateTokenValue('CODE'));      // 30
console.log(calculateTokenValue('DESIGN'));    // 25
console.log(calculateTokenValue('IDEA'));      // 20
console.log(calculateTokenValue('RESEARCH'));  // 15
```

### Viewing Payment Status:
```typescript
// Get all payments for a user
const payments = await paymentService.getUserPayments(userId);

// Get total earnings (COMPLETED only)
const earnings = await paymentService.getUserTotalEarnings(userId);

// Get payments for a challenge
const challengePayments = await paymentService.getChallengePayments(challengeId);
```

---

## Database Queries (Direct)

### View payment splits for a challenge:
```sql
SELECT
  u.email,
  c.type,
  c.tokenValue,
  p.amount,
  p.status
FROM payments p
JOIN users u ON p.userId = u.id
JOIN contributions c ON c.challengeId = p.challengeId AND c.userId = u.id
WHERE p.challengeId = 'challenge-uuid'
ORDER BY p.amount DESC;
```

### Check contribution token values:
```sql
SELECT
  type,
  COUNT(*) as count,
  AVG(tokenValue) as avg_tokens,
  SUM(tokenValue) as total_tokens
FROM contributions
GROUP BY type
ORDER BY avg_tokens DESC;
```

---

## Performance Notes

### Payment Creation:
- Uses single database transaction
- All payments created atomically
- Rollback on any failure

### Query Optimization:
- Proper indexes on foreign keys
- Batch operations where possible
- Minimal database round-trips

### Scalability:
- Handles any number of contributions
- Efficient aggregation queries
- No N+1 query problems

---

## Security Checklist

- ✅ JWT authentication required
- ✅ Authorization checks (sponsor-only completion)
- ✅ Server-side token calculation (no manipulation)
- ✅ Input validation on all endpoints
- ✅ Transaction safety for payments
- ✅ Audit logging for all operations

---

## Next Steps

### For Frontend:
1. Remove `tokenValue` from contribution form
2. Add "Complete Challenge" button (sponsor view)
3. Display payment breakdown on completion
4. Show user's payment history
5. Display total earnings on profile

### For Backend:
1. Run database migration
2. Add payment status update endpoint
3. Integrate payment gateway (Stripe/PayPal)
4. Add payment webhooks
5. Implement email notifications

---

## Getting Help

### Documentation:
- **Full API Docs:** `/home/matt/backend/API_DOCUMENTATION.md`
- **Implementation Details:** `/home/matt/backend/PHASE_2_IMPLEMENTATION_SUMMARY.md`
- **This Quick Start:** `/home/matt/backend/QUICK_START_PHASE_2.md`

### Debugging:
1. Check logs (payment service logs all operations)
2. Verify database state directly
3. Use TypeScript types for guidance
4. Test calculations independently

### Logs Location:
```bash
# Payment calculations logged here:
grep "Payment" logs/app.log

# Challenge completions:
grep "Challenge.*completed" logs/app.log
```

---

## Troubleshooting Commands

```bash
# Rebuild everything
npm run build

# Run tests
npm run test

# Check TypeScript errors
npx tsc --noEmit

# Regenerate Prisma client
npx prisma generate

# View database schema
npx prisma studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

---

## Feature Status

| Feature | Status | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Challenge Completion | ✅ Live | POST /challenges/:id/complete | Yes (Sponsor) |
| Token Calculation | ✅ Live | Automatic | N/A |
| Payment Distribution | ✅ Live | Automatic on complete | N/A |
| Payment History | ⚠️ Service Only | Use paymentService | N/A |
| Payment Status Update | ⚠️ Service Only | Use paymentService | N/A |

**Legend:**
- ✅ Live - HTTP endpoint available
- ⚠️ Service Only - Use service directly (endpoint coming soon)

---

## Example Response: Challenge Completion

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Build Authentication System",
      "description": "Need JWT auth implementation",
      "bountyAmount": 1000,
      "status": "COMPLETED",
      "sponsorId": "user-uuid",
      "sponsor": {
        "id": "user-uuid",
        "email": "sponsor@example.com"
      },
      "createdAt": "2025-10-23T10:00:00Z",
      "updatedAt": "2025-10-23T14:00:00Z",
      "contributionCount": 3
    },
    "payments": [
      {
        "id": "payment-uuid-1",
        "challengeId": "challenge-uuid",
        "userId": "user-uuid-1",
        "amount": "400.00",
        "method": "FIAT",
        "status": "PENDING",
        "createdAt": "2025-10-23T14:00:00Z",
        "updatedAt": "2025-10-23T14:00:00Z"
      }
    ],
    "paymentSummary": {
      "totalAmount": 1000,
      "totalRecipients": 3,
      "splits": [
        {
          "userId": "user-uuid-1",
          "contributionId": "contrib-uuid-1",
          "percentage": 40,
          "amount": 400,
          "tokenValue": 30
        }
      ]
    }
  }
}
```

---

**Quick Start Guide - Phase 2**
**Last Updated:** 2025-10-23
**Status:** Ready for Integration 🚀
