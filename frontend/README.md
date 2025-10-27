# oddly-brilliant Frontend

A modern React + TypeScript frontend application for the oddly-brilliant platform, built with Vite and Tailwind CSS.

## Features

- Modern React with TypeScript for type safety
- Vite for lightning-fast development and optimized builds
- Tailwind CSS for responsive, utility-first styling
- React Router for client-side routing
- Zustand for lightweight state management
- React Query for server state management
- React Hook Form + Zod for form validation
- Axios for API communication

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── challenges/    # Challenge-related components
│   ├── common/        # Reusable UI components
│   └── layout/        # Layout components (Header, Footer)
├── pages/             # Page components
├── services/          # API services
├── stores/            # Zustand stores
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks (placeholder)
```

## Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# .env file should already exist with:
VITE_API_URL=http://localhost:3001/api
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Pages

### Public Pages
- **Home** (`/`) - Landing page with features and CTAs
- **Challenges** (`/challenges`) - Browse all challenges with filters
- **Challenge Detail** (`/challenges/:id`) - View single challenge and submit contributions
- **Login** (`/login`) - User login
- **Signup** (`/signup`) - User registration

### Protected Pages (Require Authentication)
- **Dashboard** (`/dashboard`) - User dashboard with stats and recent activity
- **Profile** (`/profile`) - User profile management

## Features

### Authentication
- JWT-based authentication with Zustand store
- Token persistence in localStorage
- Protected routes with automatic redirect to login
- Automatic token attachment to API requests

### Responsive Design
- Mobile-first approach
- Responsive navigation with hamburger menu
- Tailwind CSS breakpoints for all screen sizes

### Form Validation
- React Hook Form for performant form handling
- Zod for schema validation
- User-friendly error messages

### UI Components
- Reusable Button, Input, Card components
- Loading states and error handling
- Consistent design system with Tailwind

## API Integration

The frontend connects to the backend API at `http://localhost:3001/api` by default.

### Axios Configuration
- Request interceptor adds JWT token to headers
- Response interceptor handles 401 errors (auto-logout)
- Centralized API error handling

## Styling

### Tailwind CSS
Custom configuration includes:
- Primary color palette (blue)
- Secondary color palette (purple)
- Custom component classes:
  - `.btn-primary` - Primary button
  - `.btn-secondary` - Secondary button
  - `.btn-outline` - Outlined button
  - `.input` - Form input
  - `.card` - Content card
  - `.card-interactive` - Clickable card with hover effects

## State Management

### Zustand Store
- **Auth Store** - User authentication state
  - User data
  - JWT token
  - isAuthenticated flag
  - Persisted to localStorage

## Development Notes

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Header.tsx` if needed

### Adding New API Endpoints
1. Add service methods in `src/services/`
2. Import and use in components/pages

### TypeScript
- All components use TypeScript
- Type definitions in `src/types/index.ts`
- Strict type checking enabled

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment.

## Connecting to Backend

Ensure the backend API is running at `http://localhost:3001` before starting the frontend.

Update the `VITE_API_URL` environment variable if the backend runs on a different port or domain.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox

## License

MIT
