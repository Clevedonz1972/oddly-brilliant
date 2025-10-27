# Quick Start Guide

## Complete Backend Setup - Ready to Use!

Your Node.js + Express + TypeScript + PostgreSQL backend is **100% complete** and ready to run.

---

## Prerequisites

You only need:
1. **PostgreSQL** running on your system
2. **Node.js** v18+ (already installed)

---

## 3-Step Setup

### Step 1: Create the Database

```bash
# Using createdb
createdb oddly_brilliant

# OR using psql
psql -U postgres -c "CREATE DATABASE oddly_brilliant;"
```

### Step 2: Run Database Migrations

```bash
cd /home/matt/backend
npm run prisma:migrate
```

When prompted for a migration name, enter: `init`

### Step 3: Start the Server

```bash
npm run dev
```

You should see:
```
[INFO] Environment variables validated successfully
[INFO] Middlewares initialized
[INFO] Routes initialized
[INFO] Error handling initialized
[INFO] Database connection established successfully
[INFO] Server started successfully
[INFO] Environment: development
[INFO] Port: 3001
[INFO] API URL: http://localhost:3001
```

---

## Test the API

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-23T...",
    "environment": "development",
    "database": "connected"
  }
}
```

### 2. Create a User
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@example.com",
      "walletAddress": null,
      "profile": {},
      "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Save the token!** You'll need it for authenticated requests.

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### 4. Create a Challenge (Authenticated)
```bash
# Replace YOUR_TOKEN with the token from signup/login
curl -X POST http://localhost:3001/api/challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Build user authentication",
    "description": "We need a secure authentication system with JWT tokens and password hashing",
    "bountyAmount": 1000
  }'
```

### 5. Get All Challenges (Public)
```bash
curl http://localhost:3001/api/challenges
```

### 6. Create a Contribution (Authenticated)
```bash
# Replace YOUR_TOKEN and CHALLENGE_ID
curl -X POST http://localhost:3001/api/contributions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "challengeId": "CHALLENGE_ID_HERE",
    "content": "Here is my solution to the authentication challenge...",
    "type": "CODE",
    "tokenValue": 100
  }'
```

---

## Project Structure

```
/home/matt/backend/
├── src/
│   ├── server.ts                    # Main entry point
│   │
│   ├── config/
│   │   ├── database.ts              # Prisma client singleton
│   │   └── env.ts                   # Environment config & validation
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript types, DTOs, errors
│   │
│   ├── utils/
│   │   ├── logger.ts                # Structured logging
│   │   └── helpers.ts               # Helper functions
│   │
│   ├── middleware/
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── error.ts                 # Error handling
│   │   ├── validation.ts            # Request validation
│   │   └── logger.ts                # HTTP request logging
│   │
│   ├── services/
│   │   ├── auth.service.ts          # Auth business logic
│   │   ├── wallet.service.ts        # Ethereum wallet ops
│   │   └── blockchain.service.ts    # Blockchain interactions
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   ├── challenges.controller.ts # Challenge CRUD
│   │   └── contributions.controller.ts # Contribution CRUD
│   │
│   └── routes/
│       ├── auth.routes.ts           # Auth routes + validation
│       ├── challenges.routes.ts     # Challenge routes + validation
│       └── contributions.routes.ts  # Contribution routes + validation
│
├── prisma/
│   └── schema.prisma                # Database schema
│
├── dist/                            # Compiled JavaScript (auto-generated)
│
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── eslint.config.js                 # ESLint config
├── nodemon.json                     # Nodemon config
├── jest.config.js                   # Jest config
├── README.md                        # Full documentation
└── SETUP_REPORT.md                  # Detailed setup report
```

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Start production server (requires build)

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open database GUI

# Code Quality
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (auth required)
- `PUT /wallet` - Update wallet address (auth required)

### Challenges (`/api/challenges`)
- `GET /` - List challenges (public, paginated)
- `GET /:id` - Get single challenge (public)
- `POST /` - Create challenge (auth required)
- `PATCH /:id` - Update challenge (auth required, sponsor only)
- `DELETE /:id` - Delete challenge (auth required, sponsor only)

### Contributions (`/api/contributions`)
- `GET /` - List contributions (public, paginated)
- `GET /:id` - Get single contribution (public)
- `POST /` - Create contribution (auth required)
- `DELETE /:id` - Delete contribution (auth required, creator only)

### System
- `GET /health` - Health check
- `GET /` - API info

---

## Database Models

### User
- Unique email
- Hashed password (bcrypt)
- Optional wallet address
- JSON profile data
- Timestamps

### Challenge
- Title, description
- Bounty amount (decimal)
- Status: OPEN → IN_PROGRESS → COMPLETED
- Links to sponsor (User)
- Timestamps

### Contribution
- Links to challenge and user
- Content (text)
- Type: CODE, DESIGN, or IDEA
- Token value (decimal)
- Optional blockchain transaction hash
- Timestamps

### Payment
- Links to challenge and user
- Amount (decimal)
- Method: CRYPTO or FIAT
- Status: PENDING, COMPLETED, FAILED
- Optional blockchain transaction hash
- Timestamps

---

## Features Included

✅ JWT authentication with bcrypt password hashing
✅ Full input validation on all routes
✅ Comprehensive error handling with custom error classes
✅ Request/response logging
✅ CORS configured for frontend (localhost:5173)
✅ TypeScript strict mode - 100% type-safe
✅ Prisma ORM with PostgreSQL
✅ RESTful API design
✅ Pagination support
✅ Authorization (sponsor/creator only operations)
✅ Ethereum wallet integration (ethers.js v6)
✅ Graceful shutdown handling
✅ Environment variable validation
✅ Database connection pooling
✅ ESLint + Prettier configured
✅ Production-ready error responses

---

## Common Issues

### Cannot connect to database
**Error**: `Database connection failed`

**Solution**:
1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```
2. Verify database exists:
   ```bash
   psql -U postgres -l | grep oddly_brilliant
   ```
3. Check `.env` DATABASE_URL is correct

### Port already in use
**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
```

### Prisma Client not found
**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npm run prisma:generate
```

---

## Next Steps

1. **Add Tests**: Write unit and integration tests using Jest
2. **Add Rate Limiting**: Protect against abuse
3. **Add Email Verification**: Verify user emails
4. **Add Password Reset**: Implement forgot password flow
5. **Add API Documentation**: Use Swagger/OpenAPI
6. **Add Caching**: Implement Redis for frequently accessed data
7. **Add File Uploads**: For contribution attachments
8. **Add WebSockets**: For real-time updates
9. **Add Admin Panel**: Manage users and challenges
10. **Deploy**: Deploy to production (Heroku, AWS, DigitalOcean)

---

## Support

For detailed documentation, see:
- **README.md** - Full documentation
- **SETUP_REPORT.md** - Detailed setup report
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com/

---

**STATUS: Ready to use! 🚀**

All 33 files created, TypeScript compiles, ESLint passes, Prisma Client generated.

Just create the database, run migrations, and start coding!
