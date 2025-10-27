# oddly-brilliant Frontend - Claude Code Context

## Project Overview
oddly-brilliant is a neurodivergent-friendly collaboration platform with a dark cyberpunk theme. Users tackle challenges, contribute solutions, and earn rewards through a fair token-based system.

## Current Status
✅ Phase 1-3 Complete: MVP + Polish + Admin Area
✅ Phase 4.1 Complete: Admin Governance Dashboard

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **State:** Zustand with persistence
- **Routing:** React Router 7
- **HTTP Client:** Axios
- **Testing:** Vitest + React Testing Library

## Project Structure
```
frontend/
├── src/
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   ├── pages/                     # Route pages
│   │   ├── HomePage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ChallengesPage.tsx
│   │   ├── ChallengePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── CreateChallengePage.tsx
│   │   └── admin/                 # Admin pages
│   │       ├── AdminDashboard.tsx
│   │       ├── CompliancePage.tsx
│   │       ├── EventsPage.tsx
│   │       └── ChallengesAdmin.tsx
│   ├── components/                # Reusable components
│   │   ├── auth/
│   │   │   ├── SignupForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── challenges/
│   │   │   ├── ChallengeCard.tsx
│   │   │   └── ChallengeForm.tsx
│   │   └── admin/                 # Admin components
│   │       ├── ComplianceHeartbeat.tsx
│   │       ├── EventTimeline.tsx
│   │       └── VettingQueue.tsx
│   ├── layouts/
│   │   ├── MainLayout.tsx         # Public layout
│   │   └── AdminLayout.tsx        # Admin layout
│   ├── services/
│   │   ├── api.ts                 # Axios instance
│   │   ├── auth.service.ts
│   │   ├── challenges.service.ts
│   │   └── contributions.service.ts
│   ├── store/
│   │   └── authStore.ts           # Zustand auth state
│   ├── types/
│   │   ├── index.ts               # Core types
│   │   └── governance.ts          # Governance types
│   └── styles/
│       └── index.css              # Tailwind + custom styles
└── public/                        # Static assets
```

## Design System

### Theme: Dark Cyberpunk
- **Primary Colors:** Cyan (#00ffff), Magenta (#ff00ff), Yellow (#ffff00)
- **Background:** Dark (#0a0a0a, #1a1a1a)
- **Text:** Light (#ffffff, #e0e0e0, #a0a0a0)
- **Accents:** Neon glows, scanlines, glitch effects

### Custom CSS Variables
```css
:root {
  --neon-cyan: #00ffff;
  --neon-magenta: #ff00ff;
  --neon-yellow: #ffff00;
  --bg-dark: #0a0a0a;
  --bg-darker: #050505;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}
```

### Animations (20+)
- Scanlines effect
- Glitch text
- Neon pulse
- Neon glow
- Card lift
- Ripple effect
- Fade/slide transitions
- Loading spinners
- Motion-safe variants (prefers-reduced-motion)

### Accessibility
- **WCAG 2.1 AA Compliant**
- Minimum 44px touch targets
- Color contrast ratios meet standards
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Reduced motion respect

## Routing Structure

### Public Routes
- `/` - HomePage (hero, features, CTA)
- `/signup` - SignupPage
- `/login` - LoginPage

### Protected Routes (require auth)
- `/dashboard` - User dashboard with stats
- `/challenges` - Browse all challenges
- `/challenges/:id` - Challenge detail page
- `/challenges/create` - Create new challenge
- `/profile` - User profile management

### Admin Routes (require ADMIN role)
- `/admin` - AdminDashboard (overview, metrics, quick actions)
- `/admin/compliance` - CompliancePage (system/challenge compliance)
- `/admin/events` - EventsPage (browse audit trail)
- `/admin/challenges` - ChallengesAdmin (vetting queue)

## State Management

### Zustand Store (authStore)
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

**Persistence:** localStorage (`oddly-brilliant-auth`)

## API Integration

### Base Configuration
```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
});

// Auto-attach auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Format
All backend responses follow this structure:
```typescript
{
  success: true,
  data: { ...actualData }
}
```

**Important:** Always unwrap `response.data.data` to get actual content!

### Service Layers
- **auth.service.ts** - Signup, login, profile
- **challenges.service.ts** - CRUD operations
- **contributions.service.ts** - Contribution management

## TypeScript Types

### Core Types (`src/types/index.ts`)
```typescript
interface User {
  id: string;
  email: string;
  walletAddress?: string;
  profile?: any;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  bountyAmount: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  sponsor: { id: string; email: string };
  sponsorId: string;
  vettingStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contribution {
  id: string;
  challengeId: string;
  userId: string;
  content: string;
  type: 'CODE' | 'DESIGN' | 'IDEA' | 'RESEARCH';
  tokenValue: number;
  createdAt: string;
}
```

### Governance Types (`src/types/governance.ts`)
```typescript
interface ComplianceCheck {
  name: string;
  status: 'GREEN' | 'AMBER' | 'RED';
  details: string;
  blocksAction?: boolean;
}

interface Heartbeat {
  overall: 'GREEN' | 'AMBER' | 'RED';
  checks: ComplianceCheck[];
  timestamp: string;
  challengeId?: string;
}

interface Event {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { id: string; email: string; role: string };
  createdAt: string;
  metadata?: any;
}

interface PayoutValidation {
  ok: boolean;
  violations: string[];
  warnings: string[];
  evidencePackUrl?: string;
}
```

## Phase 4.1: Admin Governance Dashboard (2025-10-25)

### Status: ✅ COMPLETE

**Mission:** Build React admin dashboard for governance system

### Components Created

#### ComplianceHeartbeat (`/src/components/admin/ComplianceHeartbeat.tsx`)
**Purpose:** Display real-time compliance status

**Features:**
- Color-coded status indicators (GREEN/AMBER/RED)
- Auto-refresh every 30 seconds
- Shows 5 compliance checks
- System-wide or challenge-specific
- Accessible status badges

**Props:**
```typescript
interface Props {
  challengeId?: string; // Optional, for challenge-specific
}
```

#### EventTimeline (`/src/components/admin/EventTimeline.tsx`)
**Purpose:** Show chronological event history

**Features:**
- Vertical timeline with left border accent
- Displays: action, actor, timestamp, metadata
- Chronological order (oldest first)
- Accessible event cards

**Props:**
```typescript
interface Props {
  entityType: string;  // "CHALLENGE", "CONTRIBUTION", etc.
  entityId: string;    // Entity ID
}
```

#### VettingQueue (`/src/components/admin/VettingQueue.tsx`)
**Purpose:** Challenge approval/rejection workflow

**Features:**
- Lists pending challenges (vettingStatus = "PENDING")
- Shows: title, description (truncated), bounty, date
- Actions: Approve, Reject, Review buttons
- Confirmation dialogs
- Real-time queue updates

**API Calls:**
- `GET /api/admin/challenges` - Fetch pending
- `POST /api/admin/challenges/:id/vet` - Approve/reject

### Pages Created

#### AdminDashboard (`/src/pages/admin/AdminDashboard.tsx`)
**Purpose:** Main admin overview

**Sections:**
1. Key metrics (challenges, users, payouts)
2. System-wide compliance heartbeat
3. Recent activity (latest 10 events)
4. Quick actions (view challenges, compliance, events)

**Features:**
- Real-time stats
- Navigation cards
- Responsive grid layout

#### CompliancePage (`/src/pages/admin/CompliancePage.tsx`)
**Purpose:** Full compliance monitoring

**Sections:**
1. System-wide compliance heartbeat
2. Challenge selector dropdown
3. Challenge-specific compliance
4. Payout validation section
5. Validation results display

**Features:**
- Switch between system/challenge views
- Run payout validation
- Display violations/warnings
- Evidence pack links

#### EventsPage (`/src/pages/admin/EventsPage.tsx`)
**Purpose:** Browse system audit trail

**Features:**
- Recent events table (50 per page)
- Filters: entity type, entity ID, date range
- Search functionality
- Pagination controls
- Export to CSV (future)

**Table Columns:**
- Timestamp
- Actor (email)
- Action
- Entity Type
- Entity ID
- View Details

#### ChallengesAdmin (`/src/pages/admin/ChallengesAdmin.tsx`)
**Purpose:** Manage all challenges

**Sections:**
1. VettingQueue (top priority)
2. All challenges table
3. Filters: status, vetting status
4. Search by title

**Features:**
- Inline challenge approval
- Filter controls
- Search box
- Pagination

### AdminLayout (`/src/layouts/AdminLayout.tsx`)
**Purpose:** Admin-specific layout wrapper

**Features:**
- Sidebar navigation with icons
- Links to all admin pages
- Header with admin user info
- Logout button
- Protected route (requires ADMIN role)
- Redirect to `/` if not admin
- Responsive sidebar (collapsible on mobile)

### Routing Updates (`/src/App.tsx`)

Added admin routes:
```typescript
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="compliance" element={<CompliancePage />} />
  <Route path="events" element={<EventsPage />} />
  <Route path="challenges" element={<ChallengesAdmin />} />
</Route>
```

### API Endpoints Used

**Events:**
- `GET /api/admin/events/recent?limit=50`
- `GET /api/admin/events/:entityType/:entityId`

**Auditor:**
- `GET /api/admin/auditor/heartbeat`
- `GET /api/admin/auditor/heartbeat/:challengeId`
- `POST /api/admin/auditor/payout/validate/:challengeId`

**Challenges:**
- `GET /api/admin/challenges` (with filters)
- `POST /api/admin/challenges/:id/vet`

### Build Status
✅ TypeScript compilation: 0 errors
✅ Production build: Successful (4.02s, 457KB)
✅ All components properly typed
✅ Responsive design tested
✅ Accessibility verified

### Key Features Delivered

✅ **Real-time Compliance Monitoring** - Auto-refresh, color-coded
✅ **Challenge Vetting Workflow** - Approve/reject with confirmations
✅ **Event Audit Trail** - Browse full system history
✅ **Payout Validation** - Pre-release checks
✅ **Admin Navigation** - Sidebar with all tools
✅ **Role-Based Access** - Admin-only protection
✅ **Accessible UI** - WCAG 2.1 AA compliant
✅ **Dark Cyberpunk Theme** - Matches existing design

### Documentation Created
- `ADMIN_DASHBOARD_IMPLEMENTATION.md` - Technical details
- `ADMIN_QUICKSTART.md` - Quick start guide
- `ADMIN_COMPONENT_MAP.txt` - Visual architecture

### Next Phase: 4.2 - AI Services
- AI-powered compliance analysis
- Automated safety moderation
- Ethics AI for fairness checks
- ML-based fraud detection

---

Last Updated: 2025-10-25
Current Phase: Phase 4.1 COMPLETE - Admin Dashboard Built
Build Status: Production-ready ✅
