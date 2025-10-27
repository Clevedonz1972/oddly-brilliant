# Admin Dashboard Quick Start Guide

## Accessing the Admin Panel

### 1. Login as Admin
```typescript
// Navigate to login page
http://localhost:5173/login

// Use admin credentials
// Note: Current implementation checks if user.email contains "admin"
// or if user.role === "ADMIN"
```

### 2. Navigate to Admin Panel
```typescript
// Direct URL
http://localhost:5173/admin

// Or click "Admin Panel" link if available in header
```

## Admin Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | AdminDashboard | Overview with metrics, compliance, recent activity |
| `/admin/compliance` | CompliancePage | System-wide and challenge-specific compliance checks |
| `/admin/events` | EventsPage | Browse all system events with filters |
| `/admin/challenges` | ChallengesAdmin | Vetting queue and all challenges management |

## Key Features

### AdminDashboard (`/admin`)
- **Stats Cards**: Total challenges, pending vetting, users, payouts
- **Compliance Heartbeat**: System-wide compliance status (auto-refreshes every 30s)
- **Recent Activity**: Latest 10 events across the platform
- **Quick Actions**: Links to compliance, challenges, and events pages

### CompliancePage (`/admin/compliance`)
- **System Compliance**: Overall platform compliance status
- **Challenge Validation**:
  1. Select a completed challenge from dropdown
  2. View challenge-specific compliance status
  3. Click "Validate Payout" to run full validation
  4. See violations, warnings, and evidence pack URL
- **Auto-refresh**: System compliance updates every 30s

### EventsPage (`/admin/events`)
- **Filters**:
  - Entity Type: CHALLENGE, CONTRIBUTION, USER, PAYMENT, VETTING
  - Entity ID: Search by specific UUID
  - Date Range: Start and end dates
- **Pagination**: 50 events per page
- **Views**: Table on desktop, cards on mobile
- **Details**: Action, actor, timestamp, metadata

### ChallengesAdmin (`/admin/challenges`)
- **Vetting Queue** (top section):
  - Shows challenges with vettingStatus=PENDING
  - Approve or Reject actions with confirmation
  - Auto-removes from queue after action
- **All Challenges** (bottom section):
  - Filter by status and vetting status
  - Search by title
  - View challenge details

## Component Usage

### Use ComplianceHeartbeat Anywhere
```typescript
import { ComplianceHeartbeat } from '@/components/admin';

// System-wide compliance
<ComplianceHeartbeat />

// Challenge-specific compliance (no auto-refresh)
<ComplianceHeartbeat
  challengeId="uuid-here"
  autoRefresh={false}
/>

// Custom refresh interval (60 seconds)
<ComplianceHeartbeat
  autoRefresh={true}
  refreshInterval={60000}
/>
```

### Use EventTimeline Anywhere
```typescript
import { EventTimeline } from '@/components/admin';

// Show events for a specific challenge
<EventTimeline
  entityType="CHALLENGE"
  entityId="challenge-uuid-here"
/>

// Show events for a specific user
<EventTimeline
  entityType="USER"
  entityId="user-uuid-here"
/>
```

### Use VettingQueue Anywhere
```typescript
import { VettingQueue } from '@/components/admin';

// Shows all pending challenges
<VettingQueue />
```

## API Requirements

### Backend Endpoints Needed
Ensure your backend implements these endpoints:

```typescript
// Events
GET  /api/admin/events/recent?limit=50
GET  /api/admin/events/:entityType/:entityId

// Auditor/Compliance
GET  /api/admin/auditor/heartbeat
GET  /api/admin/auditor/heartbeat/:challengeId
POST /api/admin/auditor/payout/validate/:challengeId

// Challenges
GET  /api/admin/challenges?status=OPEN&vettingStatus=PENDING
POST /api/admin/challenges/:id/vet
  Body: { approved: boolean }
```

### Response Formats

**Heartbeat Response:**
```json
{
  "overall": "GREEN" | "AMBER" | "RED",
  "checks": [
    {
      "name": "IP Assignments",
      "status": "GREEN",
      "details": "All contributions have valid IP assignments",
      "blocksAction": false
    }
  ],
  "timestamp": "2025-10-25T10:30:00Z",
  "challengeId": "optional-uuid"
}
```

**Event Response:**
```json
{
  "id": "event-uuid",
  "action": "CHALLENGE_CREATED",
  "entityType": "CHALLENGE",
  "entityId": "challenge-uuid",
  "actor": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "USER"
  },
  "createdAt": "2025-10-25T10:30:00Z",
  "metadata": {
    "bountyAmount": 1000,
    "title": "Challenge Title"
  }
}
```

**Payout Validation Response:**
```json
{
  "ok": true,
  "violations": [],
  "warnings": ["Minor tolerance deviation in contribution #3"],
  "evidencePackUrl": "https://storage.example.com/evidence-pack-uuid.zip"
}
```

## Admin Role Configuration

### Option 1: Email-based (Current)
```typescript
// In AdminLayout.tsx
const isAdmin = user.email.includes('admin');

// Create user with admin email
admin@oddly-brilliant.com
```

### Option 2: Role-based (Recommended)
```typescript
// Update User type in backend
interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  // ... other fields
}

// Update AdminLayout.tsx check
const isAdmin = user.role === 'ADMIN';
```

## Styling Customization

### Color Coding
```typescript
// Status colors from index.css
--success: #00ff88   // GREEN status
--warning: #ffb800   // AMBER status
--error: #ff4757     // RED status
--primary: #00d9ff   // Cyan/Electric Blue
--secondary: #ff006e // Magenta/Hot Pink
--accent: #7b2cbf    // Purple
```

### Custom Card Variants
```typescript
// Add colored accent to any Card
<Card className="card-cyan">      // Blue left border
<Card className="card-magenta">   // Pink left border
<Card className="card-purple">    // Purple left border
<Card className="card-green">     // Green left border
```

## Development Tips

### Hot Reload
```bash
# Start dev server
npm run dev

# Changes auto-reload at http://localhost:5173
```

### Debug API Calls
```typescript
// In browser console
localStorage.getItem('auth-storage')

// Check network tab for:
// - Request headers (Bearer token)
// - Response status codes
// - Response payloads
```

### Test Admin Access
```typescript
// Temporarily modify AdminLayout.tsx for testing
const isAdmin = true; // Force admin access

// Remember to revert after testing!
```

## Common Workflows

### 1. Review and Approve Challenge
1. Navigate to `/admin/challenges`
2. See pending challenge in Vetting Queue
3. Review title, description, bounty
4. Click "Approve" or "Reject"
5. Confirm in dialog
6. Challenge removed from queue

### 2. Validate Challenge Payout
1. Navigate to `/admin/compliance`
2. View system-wide compliance status
3. Select completed challenge from dropdown
4. Review challenge-specific compliance
5. Click "Validate Payout"
6. Review violations, warnings, evidence pack

### 3. Investigate User Activity
1. Navigate to `/admin/events`
2. Filter by Entity Type: "USER"
3. Search by Entity ID: user's UUID
4. Review all actions taken by user
5. Export data (future feature)

### 4. Monitor System Health
1. Navigate to `/admin` (dashboard)
2. Check system-wide compliance status
3. Review recent activity feed
4. Check pending vetting count
5. Click quick actions for deeper investigation

## Keyboard Shortcuts (Future)

These can be added for power users:
- `Ctrl+K` - Focus search
- `Ctrl+R` - Refresh current view
- `A` - Approve selected (in vetting queue)
- `R` - Reject selected (in vetting queue)
- `?` - Show keyboard shortcuts help

## Mobile Usage

### Responsive Breakpoints
- **Mobile**: < 640px (card layouts)
- **Tablet**: 640px - 1024px (mixed layouts)
- **Desktop**: > 1024px (table layouts)

### Mobile-Specific Features
- Collapsible sidebar (tap menu icon)
- Card-based event display
- Touch-friendly buttons (44px min)
- Swipe gestures for pagination (future)

## Support & Troubleshooting

### No Events Showing
- Check backend server is running
- Verify API endpoint returns data
- Check browser console for errors
- Verify auth token is valid

### Compliance Not Auto-Refreshing
- Check component is mounted
- Verify `autoRefresh={true}` prop
- Check interval timing in component
- Check network tab for periodic requests

### Vetting Actions Not Working
- Verify POST endpoint exists
- Check request payload format
- Confirm admin permissions
- Review network response errors

### Admin Access Denied
- Verify user has admin role
- Check AdminLayout.tsx role check
- Confirm authentication token
- Review backend authorization

## Next Steps

1. **Test Backend Integration**: Start backend server and test all API endpoints
2. **Add Real Data**: Populate database with test challenges and events
3. **Test Workflows**: Run through common admin workflows
4. **Performance Testing**: Load test with large datasets
5. **User Acceptance Testing**: Get feedback from actual admins

## Resources

- [Main Implementation Doc](./ADMIN_DASHBOARD_IMPLEMENTATION.md)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Axios Docs](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Ready to go!** Start the dev server and navigate to `/admin` to see your new admin dashboard in action.
